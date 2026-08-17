import { Types } from 'mongoose';
import { Cart } from './cart.model';
import { Product } from '../products/product.model';

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

/** Resolves the stock a cart operation should check against: the specific
 * variant's stock if the product has variants (a variantId is then
 * required), or the product's own stock for a simple product. */
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

export async function getCart(userId: string): Promise<{ items: any[]; total: number }> {
  const cart = await Cart.findOne({ user: userId })
    .populate('items.product', 'name price images stock variants')
    .lean();
  if (!cart) return { items: [], total: 0 };

  // A cart item's product (or the specific variant/size-color the user
  // picked) can vanish while still sitting in someone's cart — prune those
  // stale entries here so they never reach the client broken. This also
  // covers a product that gained variants AFTER it was added as a plain
  // (no-variant) line: that line no longer maps to any trackable stock, so
  // it's dropped the same as a deleted product rather than silently priced
  // off the product's base price.
  const validItems = (cart.items as any[]).filter((item) => {
    if (!item.product) return false;
    const productVariants = item.product.variants || [];
    if (item.variant) {
      return productVariants.some((v: any) => v._id.toString() === item.variant.toString());
    }
    return productVariants.length === 0;
  });
  if (validItems.length !== cart.items.length) {
    await Cart.updateOne(
      { user: userId },
      { $set: { items: validItems.map((item) => ({ product: item.product._id, variant: item.variant, quantity: item.quantity })) } }
    );
  }

  const items = validItems.map((item) => {
    const variant = item.variant
      ? (item.product.variants || []).find((v: any) => v._id.toString() === item.variant.toString())
      : undefined;
    const unitPrice = variant?.priceOverride ?? item.product.price;
    return {
      product: item.product,
      variant: variant
        ? { id: variant._id, size: variant.size, color: variant.color, stock: variant.stock, priceOverride: variant.priceOverride }
        : undefined,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
    };
  });

  const total = items.reduce((sum: number, i: any) => sum + i.subtotal, 0);
  return { items, total };
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<{ items: any[]; total: number }> {
  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    badRequest('quantity must be a positive integer');
  }
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');
  if (variantId && !Types.ObjectId.isValid(variantId)) notFound('Variant not found');

  const product = await Product.findById(productId).lean();
  if (!product) notFound('Product not found');
  const availableStock = resolveAvailableStock(product, variantId);
  if (availableStock < quantity) badRequest('Insufficient stock');

  const productObjectId = new Types.ObjectId(productId);
  const userObjectId = new Types.ObjectId(userId);
  const variantObjectId = variantId ? new Types.ObjectId(variantId) : null;
  const searchKey = `${productId}|${variantId ?? 'none'}`;
  const keyExpr = { $concat: [{ $toString: '$$item.product' }, '|', { $ifNull: [{ $toString: '$$item.variant' }, 'none'] }] };

  // Atomically increment the existing line or append a new one in a single
  // update, keyed on (product, variant) so different sizes/colors of the
  // same product are separate cart lines. Unlike a find-document ->
  // mutate-in-memory -> save() pattern, this can't lose an update when two
  // add-to-cart calls for the same user race (e.g. a rapid double-tap).
  const updated = await Cart.findOneAndUpdate(
    { user: userObjectId },
    [
      {
        $set: {
          user: { $ifNull: ['$user', userObjectId] },
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
                              { product: '$$item.product', variant: '$$item.variant', quantity: { $add: ['$$item.quantity', quantity] } },
                              '$$item',
                            ],
                          },
                        },
                      },
                      {
                        $concatArrays: [
                          { $ifNull: ['$items', []] },
                          [
                            variantObjectId
                              ? { product: productObjectId, variant: variantObjectId, quantity }
                              : { product: productObjectId, quantity },
                          ],
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ],
    { upsert: true, new: true, updatePipeline: true }
  );

  const updatedItem = updated!.items.find((i: any) => {
    const iVariant = i.variant ? i.variant.toString() : 'none';
    return i.product.toString() === productId && iVariant === (variantId ?? 'none');
  });
  if (updatedItem && updatedItem.quantity > availableStock) {
    // The combined quantity exceeds stock — compensate (this add alone was
    // still valid per the check above, only the running total isn't).
    if (updatedItem.quantity === quantity) {
      await Cart.updateOne({ user: userObjectId }, { $pull: { items: { product: productObjectId, variant: variantObjectId } } });
    } else {
      await Cart.updateOne(
        { user: userObjectId, items: { $elemMatch: { product: productObjectId, variant: variantObjectId } } },
        { $inc: { 'items.$.quantity': -quantity } }
      );
    }
    badRequest('Insufficient stock');
  }

  return getCart(userId);
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<{ items: any[]; total: number }> {
  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    badRequest('quantity must be a positive integer');
  }
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');
  if (variantId && !Types.ObjectId.isValid(variantId)) notFound('Variant not found');

  const product = await Product.findById(productId).lean();
  if (!product) notFound('Product not found');
  const availableStock = resolveAvailableStock(product, variantId);
  if (availableStock < quantity) badRequest('Insufficient stock');

  const productObjectId = new Types.ObjectId(productId);
  const variantObjectId = variantId ? new Types.ObjectId(variantId) : null;

  // Setting an absolute value (not incrementing) is already race-safe as a
  // single positional update — concurrent identical requests just apply the
  // same final value, no read-modify-write window to lose an update in.
  // $elemMatch is required here (not two separate dot-path conditions):
  // 'items.product' and 'items.variant' as siblings would each match if
  // ANY element satisfies them, not necessarily the SAME element.
  const result = await Cart.updateOne(
    { user: userId, items: { $elemMatch: { product: productObjectId, variant: variantObjectId } } },
    { $set: { 'items.$.quantity': quantity } }
  );
  if (result.matchedCount === 0) notFound('Item not in cart');

  return getCart(userId);
}

export async function removeFromCart(
  userId: string,
  productId: string,
  variantId?: string
): Promise<{ items: any[]; total: number }> {
  if (!Types.ObjectId.isValid(productId)) notFound('Product not found');
  if (variantId && !Types.ObjectId.isValid(variantId)) notFound('Variant not found');

  const productObjectId = new Types.ObjectId(productId);
  const variantObjectId = variantId ? new Types.ObjectId(variantId) : null;

  // { timestamps: false }: the schema's automatic `timestamps: true` bumps
  // `updatedAt` on every update by default, which alone counts as a
  // modification — without this, modifiedCount would read >= 1 even when
  // $pull removes nothing, and an already-removed item would wrongly look
  // like a successful removal instead of 404ing.
  const result = await Cart.updateOne(
    { user: userId },
    { $pull: { items: { product: productObjectId, variant: variantObjectId } } },
    { timestamps: false }
  );
  if (result.modifiedCount === 0) notFound('Item not in cart');

  return getCart(userId);
}

export async function clearCart(userId: string): Promise<void> {
  await Cart.updateOne({ user: userId }, { $set: { items: [] } }, { upsert: true });
}
