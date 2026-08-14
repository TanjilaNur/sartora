import { Types } from 'mongoose';
import { PointsLedger, IPointsLedger, PointsEvent } from './points_ledger.model';
import { Badge, IBadge, UserBadge } from './badge.model';
import { Order } from '../orders/order.model';
import { Review } from '../reviews/review.model';

const POINTS_TABLE: Record<PointsEvent, number> = {
  signup: 50,
  purchase: 10,
  review: 20,
};

export async function awardPoints(
  userId: string,
  event: PointsEvent,
  referenceId?: string
): Promise<IPointsLedger | null> {
  const points = POINTS_TABLE[event];
  const idempotencyKey = referenceId ? `${event}:${referenceId}` : `${event}:${userId}`;

  try {
    const entry = await PointsLedger.create({
      user: userId,
      event,
      points,
      referenceId,
      idempotencyKey,
      description: `Earned ${points} points for ${event}`,
    });
    checkAndAwardBadges(userId).catch((err) =>
      console.error(`[points] Failed to check/award badges for user ${userId}:`, err)
    );
    return entry;
  } catch (err: any) {
    if (err.code === 11000) return null; // already awarded — idempotent
    throw err;
  }
}

export async function getUserPointsBalance(userId: string): Promise<number> {
  const result = await PointsLedger.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]);
  return result[0]?.total ?? 0;
}

export async function getUserPointsHistory(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ entries: IPointsLedger[]; total: number; balance: number; page: number; pages: number }> {
  const skip = (page - 1) * limit;
  const [entries, total, balance] = await Promise.all([
    PointsLedger.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PointsLedger.countDocuments({ user: userId }),
    getUserPointsBalance(userId),
  ]);
  return { entries: entries as unknown as IPointsLedger[], total, balance, page, pages: Math.ceil(total / limit) };
}

export async function getLeaderboard(
  limit = 10,
  requestingUserId?: string
): Promise<{
  leaderboard: Array<{ rank: number; userId: string; name?: string; points: number }>;
  myRank?: { rank: number; points: number };
}> {
  const top = await PointsLedger.aggregate([
    { $group: { _id: '$user', points: { $sum: '$points' } } },
    { $sort: { points: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, userId: { $toString: '$_id' }, name: '$userInfo.name', points: 1 } },
  ]);

  const leaderboard = top.map((entry, i) => ({ rank: i + 1, ...entry }));

  let myRank: { rank: number; points: number } | undefined;
  if (requestingUserId) {
    const allRanked = await PointsLedger.aggregate([
      { $group: { _id: '$user', points: { $sum: '$points' } } },
      { $sort: { points: -1 } },
    ]);
    const myIndex = allRanked.findIndex((e) => e._id.toString() === requestingUserId);
    if (myIndex !== -1) {
      myRank = { rank: myIndex + 1, points: allRanked[myIndex].points };
    }
  }

  return { leaderboard, myRank };
}

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const badges = await Badge.find().lean();
  if (!badges.length) return;

  const [userPoints, orderCount, reviewCount] = await Promise.all([
    getUserPointsBalance(userId),
    Order.countDocuments({ user: userId }),
    Review.countDocuments({ user: userId }),
  ]);

  for (const badge of badges) {
    const { type, value } = badge.criteria;
    let earned = false;
    if (type === 'points_threshold') earned = userPoints >= value;
    else if (type === 'order_count') earned = orderCount >= value;
    else if (type === 'review_count') earned = reviewCount >= value;

    if (earned) {
      try {
        await UserBadge.create({ user: userId, badge: badge._id, earnedAt: new Date() });
      } catch (err: any) {
        if (err.code !== 11000) throw err; // duplicate key = already earned, ignore; anything else is a real failure
      }
    }
  }
}

export async function getUserBadges(userId: string): Promise<{ earned: any[]; locked: any[] }> {
  const [allBadges, earnedUserBadges] = await Promise.all([
    Badge.find().sort({ 'criteria.value': 1 }).lean(),
    UserBadge.find({ user: userId }).populate('badge').lean(),
  ]);

  const earnedBadgeIds = new Set(
    earnedUserBadges.map((ub) => (ub.badge as any)._id?.toString() ?? ub.badge.toString())
  );

  const earned = earnedUserBadges.map((ub) => ({ badge: ub.badge, earnedAt: ub.earnedAt }));
  const locked = allBadges
    .filter((b) => !earnedBadgeIds.has((b._id as any).toString()))
    .map((b) => ({ badge: b }));

  return { earned, locked };
}

export async function listBadges(): Promise<IBadge[]> {
  return Badge.find().sort({ 'criteria.value': 1 }).lean() as unknown as Promise<IBadge[]>;
}

export async function createBadge(data: {
  key: string;
  name: string;
  description: string;
  icon?: string;
  criteria: { type: string; value: number };
}): Promise<IBadge> {
  const existing = await Badge.findOne({ key: data.key }).lean();
  if (existing) {
    const err = new Error('Badge key already exists');
    (err as any).status = 409;
    throw err;
  }
  try {
    return await Badge.create({ ...data, criteria: { type: data.criteria.type as any, value: data.criteria.value } });
  } catch (err: any) {
    if (err.code === 11000) {
      const dup = new Error('Badge key already exists');
      (dup as any).status = 409;
      throw dup;
    }
    throw err;
  }
}

export async function updateBadge(
  badgeId: string,
  data: Partial<{ name: string; description: string; icon: string; criteria: { type: string; value: number } }>
): Promise<IBadge> {
  const badge = await Badge.findByIdAndUpdate(badgeId, data, { new: true, runValidators: true });
  if (!badge) {
    const err = new Error('Badge not found');
    (err as any).status = 404;
    throw err;
  }
  return badge;
}

export async function deleteBadge(badgeId: string): Promise<void> {
  const badge = await Badge.findByIdAndDelete(badgeId);
  if (!badge) {
    const err = new Error('Badge not found');
    (err as any).status = 404;
    throw err;
  }
  await UserBadge.deleteMany({ badge: badgeId });
}
