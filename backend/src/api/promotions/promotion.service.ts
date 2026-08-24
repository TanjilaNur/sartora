import { Types, ClientSession } from 'mongoose';
import { Promotion, IPromotion } from './promotion.model';
import { User } from '../users/user.model';
import { sendPushToTokens } from '../../utils/pushNotifier';

function notFound(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 404;
  throw err;
}

function badRequest(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 400;
  throw err;
}

// Best-effort, fire-and-forget from the caller's side (see createPromotion
// below) — same idiom as awardPoints(...).catch(...) elsewhere in this
// codebase: a slow or partially-failing notification blast shouldn't hold up
// (or fail) the admin's "create promotion" request.
async function notifyUsersOfPromotion(promo: IPromotion): Promise<void> {
  const recipients = await User.find({
    isDeleted: { $ne: true },
    notificationsEnabled: true,
    'pushTokens.0': { $exists: true },
  })
    .select('pushTokens')
    .lean();

  const tokens = recipients.flatMap((u: any) => u.pushTokens.map((t: any) => t.token as string));
  if (tokens.length === 0) return;

  const discountText = promo.type === 'percent' ? `${promo.value}% off` : `$${promo.value} off`;
  const title = `New promo: ${discountText}`;
  const body =
    promo.minOrderAmount > 0
      ? `Use code ${promo.code} for ${discountText} on orders of $${promo.minOrderAmount.toFixed(2)} or more.`
      : `Use code ${promo.code} for ${discountText} at checkout.`;

  const { sent, failed, invalidTokens } = await sendPushToTokens(tokens, title, body, {
    type: 'promotion',
    promoId: (promo._id as Types.ObjectId).toString(),
    code: promo.code,
  });

  if (failed > 0) {
    console.error(`[promotions] Push send: ${sent} succeeded, ${failed} failed (of ${tokens.length} tokens)`);
  }

  // Self-heal: tokens FCM reports as permanently dead would otherwise fail
  // the same way on every future promotion, forever.
  if (invalidTokens.length > 0) {
    await User.updateMany(
      { 'pushTokens.token': { $in: invalidTokens } },
      { $pull: { pushTokens: { token: { $in: invalidTokens } } } }
    );
  }
}

export async function createPromotion(data: {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  perUserLimit?: number;
  expiresAt?: Date;
}): Promise<IPromotion> {
  if (!data.code?.trim()) badRequest('code is required');
  if (!data.type) badRequest('type is required');
  if (data.value === undefined || data.value < 0) badRequest('value must be >= 0');
  if (data.type === 'percent' && data.value > 100) badRequest('percent discount cannot exceed 100');

  const exists = await Promotion.findOne({ code: data.code.toUpperCase().trim() });
  if (exists) {
    const err = new Error('Promo code already exists');
    (err as any).status = 409;
    throw err;
  }

  const promo = await Promotion.create(data);

  // New promos default to active — don't blast users for a promo an admin
  // deliberately created as inactive (a draft not yet meant to be public).
  if (promo.active) {
    notifyUsersOfPromotion(promo).catch((err) =>
      console.error('[promotions] Failed to send new-promotion push notifications:', err)
    );
  }

  return promo;
}

export async function listPromotions(): Promise<IPromotion[]> {
  return Promotion.find().sort({ createdAt: -1 }).select('-usedBy').lean() as unknown as Promise<IPromotion[]>;
}

export async function getPromotionById(id: string): Promise<IPromotion> {
  const promo = await Promotion.findById(id);
  if (!promo) notFound('Promotion not found');
  return promo;
}

export async function updatePromotion(
  id: string,
  data: Partial<Pick<IPromotion, 'active' | 'maxUses' | 'perUserLimit' | 'expiresAt' | 'minOrderAmount' | 'value' | 'type'>>
): Promise<IPromotion> {
  if (data.type === 'percent' && data.value !== undefined && data.value > 100) {
    badRequest('percent discount cannot exceed 100');
  }
  const promo = await Promotion.findByIdAndUpdate(id, data, { new: true });
  if (!promo) notFound('Promotion not found');
  return promo;
}

export async function deletePromotion(id: string): Promise<void> {
  const promo = await Promotion.findByIdAndDelete(id);
  if (!promo) notFound('Promotion not found');
}

export interface PromoValidationResult {
  valid: boolean;
  discount: number;
  finalTotal: number;
  promoCode: string;
  type: 'percent' | 'fixed';
  value: number;
}

export async function validatePromoCode(
  code: string,
  userId: string,
  orderTotal: number
): Promise<PromoValidationResult> {
  if (!code?.trim()) badRequest('code is required');
  if (orderTotal < 0) badRequest('orderTotal must be >= 0');

  const promo = await Promotion.findOne({ code: code.toUpperCase().trim() });
  if (!promo || !promo.active) {
    const err = new Error('Invalid or inactive promo code');
    (err as any).status = 400;
    throw err;
  }

  if (promo.expiresAt && new Date() > promo.expiresAt) {
    badRequest('Promo code has expired');
  }

  if (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
    badRequest('Promo code has reached its maximum usage limit');
  }

  if (orderTotal < promo.minOrderAmount) {
    badRequest(`Minimum order amount for this promo is ${promo.minOrderAmount}`);
  }

  const userUses = promo.usedBy.filter((u) => u.user.toString() === userId).length;
  if (userUses >= promo.perUserLimit) {
    badRequest('You have already used this promo code the maximum number of times');
  }

  const discount =
    promo.type === 'percent'
      ? Math.round(orderTotal * (promo.value / 100) * 100) / 100
      : Math.min(promo.value, orderTotal);

  const finalTotal = Math.max(0, Math.round((orderTotal - discount) * 100) / 100);

  return { valid: true, discount, finalTotal, promoCode: promo.code, type: promo.type, value: promo.value };
}

export async function applyPromoCode(
  code: string,
  userId: string,
  orderTotal: number,
  session?: ClientSession
): Promise<{ discount: number; finalTotal: number }> {
  const normalizedCode = code.toUpperCase().trim();
  if (!normalizedCode) badRequest('code is required');
  if (orderTotal < 0) badRequest('orderTotal must be >= 0');

  // active/expiresAt/minOrderAmount aren't consumed by usage, so a plain
  // read is fine — they can't be "raced" the way a usage counter can.
  const existing = await Promotion.findOne({ code: normalizedCode }).session(session ?? null);
  if (!existing || !existing.active) badRequest('Invalid or inactive promo code');
  if (existing.expiresAt && new Date() > existing.expiresAt) badRequest('Promo code has expired');
  if (orderTotal < existing.minOrderAmount) {
    badRequest(`Minimum order amount for this promo is ${existing.minOrderAmount}`);
  }

  const userObjectId = new Types.ObjectId(userId);

  // maxUses/perUserLimit ARE subject to a race: under concurrent requests,
  // every caller could read "still under the limit" before any of them
  // increments usedCount, letting the cap be bypassed. Check-and-consume
  // atomically in a single update instead of check-then-write.
  const promo = await Promotion.findOneAndUpdate(
    {
      code: normalizedCode,
      active: true,
      $expr: {
        $and: [
          { $or: [{ $eq: ['$maxUses', null] }, { $lt: ['$usedCount', '$maxUses'] }] },
          {
            $lt: [
              { $size: { $filter: { input: '$usedBy', as: 'u', cond: { $eq: ['$$u.user', userObjectId] } } } },
              '$perUserLimit',
            ],
          },
        ],
      },
    },
    { $inc: { usedCount: 1 }, $push: { usedBy: { user: userObjectId, usedAt: new Date() } } },
    { new: true, session }
  );

  if (!promo) {
    // Re-read purely to report which specific cap was hit; this doesn't
    // affect correctness — the atomic update above already made the call.
    const fresh = await Promotion.findOne({ code: normalizedCode }).session(session ?? null);
    if (fresh && fresh.maxUses !== undefined && fresh.usedCount >= fresh.maxUses) {
      badRequest('Promo code has reached its maximum usage limit');
    }
    badRequest('You have already used this promo code the maximum number of times');
  }

  const discount =
    promo.type === 'percent'
      ? Math.round(orderTotal * (promo.value / 100) * 100) / 100
      : Math.min(promo.value, orderTotal);
  const finalTotal = Math.max(0, Math.round((orderTotal - discount) * 100) / 100);

  return { discount, finalTotal };
}
