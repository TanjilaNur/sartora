import { Types } from 'mongoose';
import { User, IAddress } from './user.model';
import { Product } from '../products/product.model';
import { Order } from '../orders/order.model';
import { getUserOrders } from '../orders/order.service';
import { getUserPointsBalance, getUserBadges } from '../points/points.service';
import { getUserReviews } from '../reviews/review.service';

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

function sanitizeUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hasGoogleAccount: !!user.googleId,
    notificationsEnabled: user.notificationsEnabled,
  };
}

interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export async function listCustomers(
  filters: CustomerFilters
): Promise<{ customers: any[]; total: number; page: number; pages: number }> {
  const { search, page = 1, limit = 20 } = filters;
  // This is a customer directory, not a general user directory — staff
  // accounts are never included, regardless of search terms.
  const query: Record<string, any> = { role: 'user' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  // One aggregation covering every user on this page — avoids an N+1 query
  // per row just to show lifetime order count/spend in the list.
  const userIds = users.map((u: any) => u._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: userIds }, paymentStatus: 'paid' } },
    { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
  ]);
  const statsByUser = new Map(orderStats.map((s: any) => [s._id.toString(), s]));

  const customers = users.map((u: any) => ({
    ...u,
    orderCount: statsByUser.get(u._id.toString())?.orderCount ?? 0,
    totalSpent: statsByUser.get(u._id.toString())?.totalSpent ?? 0,
  }));

  return { customers, total, page, pages: Math.ceil(total / limit) };
}

export async function getCustomerProfile(userId: string) {
  const user = await User.findById(userId).select('-password -refreshToken').lean();
  if (!user || (user as any).role === 'admin') notFound('Customer not found');

  const [orders, pointsBalance, badges, reviews] = await Promise.all([
    getUserOrders(userId),
    getUserPointsBalance(userId),
    getUserBadges(userId),
    getUserReviews(userId),
  ]);

  const totalSpent = orders
    .filter((o: any) => o.paymentStatus === 'paid')
    .reduce((sum: number, o: any) => sum + o.total, 0);

  return {
    user,
    stats: {
      totalOrders: orders.length,
      totalSpent,
      pointsBalance,
      badgeCount: badges.earned.length,
      reviewCount: reviews.length,
    },
    orders,
    badges: badges.earned,
  };
}

// ── Self-service profile ────────────────────────────────────────────────────

export async function getMyProfile(userId: string) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).lean();
  if (!user) notFound('User not found');
  return sanitizeUser(user);
}

export async function updateMyProfile(
  userId: string,
  data: { name?: string; email?: string; phone?: string }
) {
  const update: Record<string, any> = {};
  if (data.name !== undefined) {
    if (!data.name.trim()) badRequest('name cannot be empty');
    update.name = data.name.trim();
  }
  if (data.email !== undefined) {
    if (!data.email.trim()) badRequest('email cannot be empty');
    update.email = data.email.toLowerCase().trim();
  }
  if (data.phone !== undefined) {
    if (!data.phone.trim()) badRequest('phone cannot be empty');
    update.phone = data.phone.trim();
  }

  let user;
  try {
    // isDeleted: {$ne: true} keeps this from racing a concurrent
    // deactivateMyAccount call — without it, a profile edit that lands just
    // after a deletion's scrub could silently resurrect a real name/email
    // on an account that's supposed to be fully anonymized.
    user = await User.findOneAndUpdate({ _id: userId, isDeleted: { $ne: true } }, update, {
      new: true,
      runValidators: true,
    });
  } catch (err: any) {
    // Backstopped by the unique indexes on email/phone.
    if (err.code === 11000) badRequest('That email or phone number is already in use');
    throw err;
  }
  if (!user) notFound('User not found');
  return sanitizeUser(user);
}

export async function deactivateMyAccount(userId: string): Promise<void> {
  // Soft-delete: order/review history references this user and shouldn't be
  // orphaned or silently deleted along with the account, so the account is
  // deactivated and its PII scrubbed rather than the document being removed.
  //
  // A single atomic findOneAndUpdate (rather than findById -> mutate ->
  // .save()) matters here specifically: two concurrent delete requests for
  // the same account (e.g. an impatient double-click, or a client retry
  // after a slow response) both loading the document before either saves
  // would race on Mongoose's version check when both then call .save() —
  // confirmed live, the loser throws a VersionError that surfaces as a 500
  // instead of the idempotent no-op a repeated delete should be. The
  // `isDeleted: { $ne: true }` filter makes a second call simply match zero
  // documents and no-op cleanly.
  const suffix = `deleted-${userId}`;
  const hashedPassword = await import('bcrypt').then((b) => b.hash(new Types.ObjectId().toString(), 10));

  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        name: 'Deleted User',
        email: `${suffix}@deleted.sartora.invalid`,
        phone: suffix,
        password: hashedPassword,
        addresses: [],
        wishlist: [],
      },
      $unset: { refreshToken: '', googleId: '' },
    }
  );

  if (!result) {
    const exists = await User.exists({ _id: userId });
    if (!exists) notFound('User not found');
    // Already deleted by a concurrent/earlier call — nothing left to do.
  }
}

// ── Address book ─────────────────────────────────────────────────────────────

export interface AddressInput {
  label?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

function validateAddressInput(data: Partial<AddressInput>, requireAll: boolean): void {
  const fields: (keyof AddressInput)[] = ['street', 'city', 'state', 'zip', 'country'];
  for (const f of fields) {
    if (requireAll && !data[f]?.toString().trim()) badRequest(`${f} is required`);
  }
}

export async function listMyAddresses(userId: string): Promise<IAddress[]> {
  const user = await User.findById(userId).select('addresses').lean();
  if (!user) notFound('User not found');
  return user.addresses;
}

export async function addMyAddress(userId: string, data: AddressInput): Promise<IAddress[]> {
  validateAddressInput(data, true);

  const newAddress = {
    _id: new Types.ObjectId(),
    label: data.label?.trim() || 'Home',
    street: data.street.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    zip: data.zip.trim(),
    country: data.country.trim(),
  };
  const explicitDefault = !!data.isDefault;

  // Atomic (aggregation-pipeline findOneAndUpdate) rather than
  // findById -> push -> .save(): "is this the user's first address" was
  // previously decided from a JS-side snapshot of the array, so N
  // concurrent adds for a user starting with zero addresses each
  // independently saw an empty array and each marked itself default —
  // confirmed live, 8 concurrent adds produced 8 addresses ALL flagged
  // default. $size here is evaluated by MongoDB against the document as it
  // actually is at write time, so concurrent adds serialize correctly
  // instead of racing on a stale read (mirrors the atomic increment-or-
  // append pipeline in guest_cart.service.ts::addToGuestCart). The
  // isDeleted filter closes a separate race with a concurrent
  // deactivateMyAccount: without it, an add landing just after the
  // account's scrub would resurrect a real address on a "deleted" account.
  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true } },
    [
      {
        $set: {
          addresses: {
            $let: {
              vars: {
                willBeDefault: {
                  $or: [explicitDefault, { $eq: [{ $size: { $ifNull: ['$addresses', []] } }, 0] }],
                },
              },
              in: {
                $concatArrays: [
                  {
                    $cond: [
                      '$$willBeDefault',
                      {
                        $map: {
                          input: { $ifNull: ['$addresses', []] },
                          as: 'a',
                          in: { $mergeObjects: ['$$a', { isDefault: false }] },
                        },
                      },
                      { $ifNull: ['$addresses', []] },
                    ],
                  },
                  [{ $mergeObjects: [newAddress, { isDefault: '$$willBeDefault' }] }],
                ],
              },
            },
          },
        },
      },
    ],
    { new: true, updatePipeline: true }
  );

  if (!result) notFound('User not found');
  return result.addresses;
}

export async function updateMyAddress(
  userId: string,
  addressId: string,
  data: Partial<AddressInput>
): Promise<IAddress[]> {
  validateAddressInput(data, false);
  if (!Types.ObjectId.isValid(addressId)) notFound('Address not found');

  const setFields: Record<string, unknown> = {};
  if (data.label !== undefined) setFields['addresses.$[target].label'] = data.label.trim() || 'Home';
  if (data.street !== undefined) setFields['addresses.$[target].street'] = data.street.trim();
  if (data.city !== undefined) setFields['addresses.$[target].city'] = data.city.trim();
  if (data.state !== undefined) setFields['addresses.$[target].state'] = data.state.trim();
  if (data.zip !== undefined) setFields['addresses.$[target].zip'] = data.zip.trim();
  if (data.country !== undefined) setFields['addresses.$[target].country'] = data.country.trim();

  const arrayFilters: Record<string, unknown>[] = [{ 'target._id': new Types.ObjectId(addressId) }];

  if (data.isDefault) {
    // Atomically flip every OTHER address to non-default in the SAME update
    // as promoting this one, via a second arrayFilters-scoped $set.
    // Previously this was two JS-side steps (un-default all, then set mine)
    // before one `.save()` — two concurrent "set address X as default"
    // calls for DIFFERENT addresses could each read a state where the
    // other's change hadn't landed yet, and whichever `.save()` physically
    // wrote last would win outright, silently discarding the other's
    // change entirely (not just its default flag).
    setFields['addresses.$[target].isDefault'] = true;
    setFields['addresses.$[others].isDefault'] = false;
    arrayFilters.push({ 'others._id': { $ne: new Types.ObjectId(addressId) } });
  }

  if (Object.keys(setFields).length === 0) {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).select('addresses').lean();
    if (!user) notFound('User not found');
    if (!user.addresses.some((a: any) => String(a._id) === addressId)) notFound('Address not found');
    return user.addresses as IAddress[];
  }

  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true }, 'addresses._id': addressId },
    { $set: setFields },
    { new: true, arrayFilters }
  );

  if (!result) {
    if (!(await User.exists({ _id: userId }))) notFound('User not found');
    notFound('Address not found');
  }
  return result.addresses;
}

export async function deleteMyAddress(userId: string, addressId: string): Promise<IAddress[]> {
  if (!Types.ObjectId.isValid(addressId)) notFound('Address not found');
  const addressObjectId = new Types.ObjectId(addressId);

  if (!(await User.exists({ _id: userId, isDeleted: { $ne: true }, 'addresses._id': addressObjectId }))) {
    if (!(await User.exists({ _id: userId, isDeleted: { $ne: true } }))) notFound('User not found');
    notFound('Address not found');
  }

  // Atomic (aggregation-pipeline update) rather than
  // findById -> pull -> maybe-reassign-default -> .save(): two concurrent
  // deletes of DIFFERENT addresses previously raced on that same
  // read-then-.save() window — the .save() that physically wrote last would
  // win with ITS OWN full in-memory array, silently resurrecting whatever
  // the other request had just removed. Computing "was the deleted one
  // default" and "who's promoted next" inside one MongoDB-evaluated update
  // removes that window entirely. isDeleted excludes a concurrent
  // deactivateMyAccount the same way as addMyAddress/updateMyAddress above.
  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true } },
    [
      {
        $set: {
          addresses: {
            $let: {
              vars: {
                removed: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: { $ifNull: ['$addresses', []] },
                        as: 'a',
                        cond: { $eq: ['$$a._id', addressObjectId] },
                      },
                    },
                    0,
                  ],
                },
                remaining: {
                  $filter: {
                    input: { $ifNull: ['$addresses', []] },
                    as: 'a',
                    cond: { $ne: ['$$a._id', addressObjectId] },
                  },
                },
              },
              in: {
                $cond: [
                  { $and: [{ $ifNull: ['$$removed.isDefault', false] }, { $gt: [{ $size: '$$remaining' }, 0] }] },
                  {
                    $concatArrays: [
                      [{ $mergeObjects: [{ $arrayElemAt: ['$$remaining', 0] }, { isDefault: true }] }],
                      { $slice: ['$$remaining', 1, { $size: '$$remaining' }] },
                    ],
                  },
                  '$$remaining',
                ],
              },
            },
          },
        },
      },
    ],
    { new: true, updatePipeline: true }
  );

  if (!result) notFound('User not found');
  return result.addresses;
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export async function getMyWishlist(userId: string) {
  const user = await User.findById(userId).select('wishlist').populate('wishlist').lean();
  if (!user) notFound('User not found');
  // A wishlisted product can be deleted later — filter those out rather
  // than surfacing a null entry to the client.
  return (user.wishlist as any[]).filter(Boolean);
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');
  const product = await Product.findById(productId).select('_id').lean();
  if (!product) notFound('Product not found');
  // $addToSet is atomic and naturally idempotent — no lost updates or
  // duplicate entries under concurrent "add to wishlist" taps. isDeleted
  // keeps a wishlist add from silently re-populating data on an account a
  // concurrent deactivateMyAccount just cleared.
  await User.updateOne({ _id: userId, isDeleted: { $ne: true } }, { $addToSet: { wishlist: productId } });
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await User.updateOne({ _id: userId, isDeleted: { $ne: true } }, { $pull: { wishlist: productId } });
}

// ── Notification preferences ────────────────────────────────────────────────

export async function updateNotificationPreferences(userId: string, prefs: { enabled: boolean }) {
  const user = await User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true } },
    { $set: { notificationsEnabled: prefs.enabled } },
    { new: true }
  );
  if (!user) notFound('User not found');
  return user.notificationsEnabled;
}

// ── Push notification tokens ────────────────────────────────────────────────

const PUSH_PLATFORMS = ['ios', 'android', 'web'] as const;

export async function registerPushToken(
  userId: string,
  data: { token: string; platform: 'ios' | 'android' | 'web' }
): Promise<void> {
  if (!data.token?.trim()) badRequest('token is required');
  if (!PUSH_PLATFORMS.includes(data.platform)) badRequest('platform must be ios, android, or web');

  // Pipeline update: drop any existing entry for this exact token, then
  // append the fresh one, as one atomic step — the same device re-registering
  // (app relaunch, token refresh) can't race a plain read-modify-write into
  // leaving a stale duplicate of itself behind.
  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true } },
    [
      {
        $set: {
          pushTokens: {
            $concatArrays: [
              { $filter: { input: '$pushTokens', as: 't', cond: { $ne: ['$$t.token', data.token] } } },
              [{ token: data.token, platform: data.platform, createdAt: new Date() }],
            ],
          },
        },
      },
    ],
    { updatePipeline: true }
  );
  if (!result) notFound('User not found');
}

export async function unregisterPushToken(userId: string, token: string): Promise<void> {
  if (!token?.trim()) badRequest('token is required');
  await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token } } });
}
