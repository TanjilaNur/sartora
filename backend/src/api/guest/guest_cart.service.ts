import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { GuestCart } from './guest_cart.model';
import { Product } from '../products/product.model';
import { Cart } from '../cart/cart.model';

const GUEST_CART_TTL_DAYS = 7;

function badRequest(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 400;
  throw err;
}

function notFound(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 404;
  throw err;
}

function ttlDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + GUEST_CART_TTL_DAYS);
  return d;
}

/** Mirrors cart.service's resolveAvailableStock: a variantId is required
 * once a product has variants, and stock is checked against that specific
 * variant rather than the product's aggregate stock. */
function resolveAvailableStock(product: any, variantId: string | undefined): number {
  if (product.variants && product.variants.length > 0) {
    if (!variantId) badRequest('Please select a size/color for this product');
    const variant = product.variants.find((v: any) => v._id.toString() === variantId);
    if (!variant) notFound('Variant not found');
    return variant.stock;
  }
  if (variantId) badRequest('This product does not have variants');
  return product.stock;
}

export async function createGuestSession(): Promise<{ guestId: string }> {
  const guestId = randomUUID();
  await GuestCart.create({ guestId, items: [], expiresAt: ttlDate() });
  return { guestId };
}

export async function getGuestCart(guestId: string): Promise<{ items: any[]; total: number }> {
  const cart = await GuestCart.findOne({ guestId }).lean();
  if (!cart) notFound('Guest session not found');

  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } }, 'name price images stock variants').lean();
  const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  // A cart item's product (or the specific variant/size-color picked) can
  // vanish while still sitting in a guest cart — prune those here so they
  // never reach the client broken, mirroring cart.service.ts::getCart
  // (the authenticated path already did this; this one didn't).
  const validItems = cart.items.filter((item) => {
    const product = productMap.get(item.productId);
    if (!product) return false;
    const productVariants = (product as any).variants || [];
    if (item.variantId) {
      return productVariants.some((v: any) => v._id.toString() === item.variantId);
    }
    return productVariants.length === 0;
  });
  if (validItems.length !== cart.items.length) {
    await GuestCart.updateOne(
      { guestId },
      {
        $set: {
          items: validItems.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
        },
      }
    );
  }

  const items = validItems.map((item) => {
    const product = productMap.get(item.productId);
    const variant = item.variantId
      ? (product as any).variants?.find((v: any) => v._id.toString() === item.variantId)
      : undefined;
    const unitPrice = variant?.priceOverride ?? (product as any).price;
    return {
      productId: item.productId,
      product,
      variant: variant
        ? { id: variant._id, size: variant.size, color: variant.color, stock: variant.stock, priceOverride: variant.priceOverride }
        : undefined,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
    };
  });

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  return { items, total };
}

/** Matches a specific (productId, variantId) cart line for $elemMatch/$pull
 * — variantId absent must match "no variantId field", not "any variantId",
 * so a plain-product line and a variant line for the same product stay
 * distinct entries. */
function lineMatch(productId: string, variantId?: string): Record<string, any> {
  return variantId ? { productId, variantId } : { productId, variantId: { $exists: false } };
}

export async function addToGuestCart(
  guestId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<{ items: any[]; total: number }> {
  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    badRequest('quantity must be a positive integer');
  }
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');

  const product = await Product.findById(productId);
  if (!product) notFound('Product not found');
  const availableStock = resolveAvailableStock(product, variantId);
  if (availableStock < quantity) badRequest('Insufficient stock');

  // Atomically increment the existing line or append a new one in a single
  // update, mirroring cart.service.ts::addToCart — a find-document ->
  // mutate-in-memory -> save() pattern here can lose an update (or create
  // two separate lines for the same product/variant) when two add-to-cart
  // calls for the same guest session race (a rapid double-tap, or two tabs
  // sharing the same guest id).
  const searchKey = `${productId}|${variantId ?? 'none'}`;
  const keyExpr = { $concat: [{ $ifNull: ['$$item.productId', ''] }, '|', { $ifNull: ['$$item.variantId', 'none'] }] };

  const updated = await GuestCart.findOneAndUpdate(
    { guestId },
    [
      {
        $set: {
          items: {
            $let: {
              vars: { keys: { $map: { input: { $ifNull: ['$items', []] }, as: 'item', in: keyExpr } } },
              in: {
                $let: {
                  vars: { idx: { $indexOfArray: ['$$keys', searchKey] } },
                  in: {
                    $cond: [
                      { $gte: ['$$idx', 0] },
                      {
                        $map: {
                          input: '$items',
                          as: 'item',
                          in: {
                            $cond: [
                              { $eq: [keyExpr, searchKey] },
                              { productId: '$$item.productId', variantId: '$$item.variantId', quantity: { $add: ['$$item.quantity', quantity] } },
                              '$$item',
                            ],
                          },
                        },
                      },
                      {
                        $concatArrays: [
                          { $ifNull: ['$items', []] },
                          [variantId ? { productId, variantId, quantity } : { productId, quantity }],
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
          expiresAt: ttlDate(),
        },
      },
    ],
    { new: true, updatePipeline: true }
  );
  if (!updated) notFound('Guest session not found');

  const updatedItem = updated.items.find((i) => i.productId === productId && (i.variantId ?? undefined) === variantId);
  if (updatedItem && updatedItem.quantity > availableStock) {
    // Combined quantity exceeds stock — compensate (this add alone was
    // still valid per the check above; only the running total isn't),
    // mirroring cart.service.ts::addToCart.
    if (updatedItem.quantity === quantity) {
      await GuestCart.updateOne({ guestId }, { $pull: { items: lineMatch(productId, variantId) } });
    } else {
      await GuestCart.updateOne(
        { guestId, items: { $elemMatch: lineMatch(productId, variantId) } },
        { $inc: { 'items.$.quantity': -quantity } }
      );
    }
    badRequest('Insufficient stock');
  }

  return getGuestCart(guestId);
}

export async function updateGuestCartItem(
  guestId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<{ items: any[]; total: number }> {
  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    badRequest('quantity must be a positive integer');
  }
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');

  const product = await Product.findById(productId);
  if (!product) notFound('Product not found');
  const availableStock = resolveAvailableStock(product, variantId);
  if (availableStock < quantity) badRequest('Insufficient stock');

  // Setting an absolute value (not incrementing) is already race-safe as a
  // single positional update — see the matching comment in
  // cart.service.ts::updateCartItem.
  const result = await GuestCart.updateOne(
    { guestId, items: { $elemMatch: lineMatch(productId, variantId) } },
    { $set: { 'items.$.quantity': quantity, expiresAt: ttlDate() } }
  );
  if (result.matchedCount === 0) {
    // Only pays for this extra lookup on the (rare) error path — distinguishes
    // "no such session" from "session exists, item isn't in it" without an
    // upfront read-then-write race window on the happy path.
    if (!(await GuestCart.exists({ guestId }))) notFound('Guest session not found');
    notFound('Item not in guest cart');
  }

  return getGuestCart(guestId);
}

export async function removeFromGuestCart(
  guestId: string,
  productId: string,
  variantId?: string
): Promise<{ items: any[]; total: number }> {
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');

  // Two things must NOT ride along in this same update, or they'd make
  // modifiedCount >= 1 regardless of whether $pull actually matched a
  // line, silently defeating the "item not in cart" check below:
  //  1. $set: {expiresAt} — an unconditional field write of its own.
  //  2. The schema's automatic `timestamps: true` — Mongoose bumps
  //     `updatedAt` on every update by default, which itself counts as a
  //     modification even when $pull removes nothing. { timestamps: false }
  //     opts this one call out of that.
  // Both are applied in a separate call instead, only once we know the
  // removal genuinely happened.
  const result = await GuestCart.updateOne(
    { guestId },
    { $pull: { items: lineMatch(productId, variantId) } },
    { timestamps: false }
  );
  if (result.matchedCount === 0) notFound('Guest session not found');
  if (result.modifiedCount === 0) notFound('Item not in guest cart');

  await GuestCart.updateOne({ guestId }, { $set: { expiresAt: ttlDate() } });
  return getGuestCart(guestId);
}

export async function clearGuestCart(guestId: string): Promise<void> {
  const result = await GuestCart.updateOne({ guestId }, { $set: { items: [], expiresAt: ttlDate() } });
  if (result.matchedCount === 0) notFound('Guest session not found');
}

export async function listGuestSessions(
  page: number,
  limit: number
): Promise<{ sessions: any[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    GuestCart.find({}, 'guestId items expiresAt createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GuestCart.countDocuments(),
  ]);
  const formatted = sessions.map((s: any) => ({
    guestId: s.guestId,
    itemCount: s.items.length,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
  }));
  return { sessions: formatted, total, page, totalPages: Math.ceil(total / limit) };
}

export async function deleteGuestSession(guestId: string): Promise<void> {
  const result = await GuestCart.deleteOne({ guestId });
  if (result.deletedCount === 0) notFound('Guest session not found');
}

export async function mergeGuestCartIntoUser(
  guestId: string,
  userId: string
): Promise<{ items: any[]; total: number }> {
  const { getCart } = await import('../cart/cart.service');

  const guestCart = await GuestCart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) {
    // Nothing to merge — just return the current user cart.
    return getCart(userId);
  }

  const productIds = guestCart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } }, 'price stock variants').lean();
  const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  const existingCart = await Cart.findOne({ user: userId }).lean();
  const mergedItems = new Map<string, number>(
    (existingCart?.items ?? []).map((i: any) => [`${i.product.toString()}|${i.variant ? i.variant.toString() : 'none'}`, i.quantity])
  );

  for (const guestItem of guestCart.items) {
    if (!Types.ObjectId.isValid(guestItem.productId)) continue;
    const product = productMap.get(guestItem.productId);
    if (!product) continue;

    const key = `${guestItem.productId}|${guestItem.variantId ?? 'none'}`;
    const capacity = guestItem.variantId
      ? (product as any).variants?.find((v: any) => v._id.toString() === guestItem.variantId)?.stock
      : (product as any).stock;
    if (capacity === undefined) continue; // the size/color the guest picked no longer exists

    const currentQty = mergedItems.get(key) ?? 0;
    const newQty = Math.min(currentQty + guestItem.quantity, capacity);
    if (newQty > 0) mergedItems.set(key, newQty);
  }

  await Cart.updateOne(
    { user: userId },
    {
      $set: {
        items: Array.from(mergedItems.entries()).map(([key, quantity]) => {
          const [product, variant] = key.split('|');
          return variant === 'none'
            ? { product: new Types.ObjectId(product), quantity }
            : { product: new Types.ObjectId(product), variant: new Types.ObjectId(variant), quantity };
        }),
      },
    },
    { upsert: true }
  );

  await GuestCart.deleteOne({ guestId });

  return getCart(userId);
}
