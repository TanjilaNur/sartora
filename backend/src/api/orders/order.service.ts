import mongoose from 'mongoose';
import { Cart } from '../cart/cart.model';
import { Product } from '../products/product.model';
import { Order, IOrder, IAddress } from './order.model';
import { applyPromoCode } from '../promotions/promotion.service';
import { awardPoints } from '../points/points.service';

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

function forbidden(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 403;
  throw err;
}

export async function placeOrder(
  userId: string,
  address: IAddress,
  paymentDetails: { method: string; transactionId?: string },
  promoCode?: string
): Promise<IOrder> {
  if (!address?.street || !address?.city || !address?.state || !address?.zip || !address?.country) {
    badRequest('address must include street, city, state, zip, and country');
  }
  if (!paymentDetails?.method) badRequest('paymentDetails.method is required');

  const session = await mongoose.startSession();
  let createdOrder: IOrder | undefined;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);
      if (!cart || cart.items.length === 0) badRequest('Cart is empty');

      const orderItems: any[] = [];
      let total = 0;

      // Reserve stock one item at a time, atomically, inside the
      // transaction: the check (stock >= quantity) and the decrement
      // happen as a single conditional update, so two concurrent orders
      // for the last unit of a product (or a specific size/color) can't
      // both pass a stale check and both decrement (the classic oversell
      // race). If any item can't be reserved, the whole transaction aborts
      // and every decrement already applied earlier in this loop is rolled
      // back automatically.
      for (const item of cart.items as any[]) {
        const product = item.product;
        if (!product) badRequest('A product in your cart no longer exists');
        if (!item.variant && product.variants && product.variants.length > 0) {
          badRequest(`"${product.name}" now requires selecting a size/color — please remove and re-add it to your cart`);
        }

        let unitPrice = product.price;
        let size: string | undefined;
        let color: string | undefined;
        let filter: Record<string, any> = { _id: product._id, stock: { $gte: item.quantity } };
        let update: Record<string, any> = { $inc: { stock: -item.quantity } };

        if (item.variant) {
          const variant = (product.variants || []).find((v: any) => v._id.toString() === item.variant.toString());
          if (!variant) badRequest(`A variant of "${product.name}" in your cart no longer exists`);
          unitPrice = variant.priceOverride ?? product.price;
          size = variant.size;
          color = variant.color;
          // $elemMatch is required: separate 'variants._id' / 'variants.stock'
          // dot-path conditions are each satisfied by SOME array element, not
          // necessarily the SAME one, which left the positional $ below free
          // to resolve against a different variant than the one being
          // ordered (caught live — a different variant's stock was
          // decremented instead of the selected one).
          filter = { _id: product._id, variants: { $elemMatch: { _id: item.variant, stock: { $gte: item.quantity } } } };
          update = { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } };
        }

        const decremented = await Product.findOneAndUpdate(filter, update, { new: true, session });
        if (!decremented) badRequest(`Insufficient stock for "${product.name}"`);

        orderItems.push({
          product: product._id,
          variant: item.variant,
          name: product.name,
          size,
          color,
          price: unitPrice,
          quantity: item.quantity,
        });
        total += unitPrice * item.quantity;
      }

      const subtotal = total;
      let discount = 0;
      let appliedPromoCode: string | undefined;

      if (promoCode) {
        const promoResult = await applyPromoCode(promoCode, userId, subtotal, session);
        discount = promoResult.discount;
        total = promoResult.finalTotal;
        appliedPromoCode = promoCode.toUpperCase().trim();
      }

      const [order] = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            subtotal,
            discount,
            promoCode: appliedPromoCode,
            total,
            address,
            paymentDetails,
          },
        ],
        { session }
      );

      await Cart.updateOne({ user: userId }, { $set: { items: [] } }, { session });

      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }

  const order = createdOrder!;
  awardPoints(userId, 'purchase', (order._id as any).toString()).catch((err) =>
    console.error(`[points] Failed to award purchase points for order ${order._id}:`, err)
  );

  return order;
}

export async function getUserOrders(userId: string): Promise<IOrder[]> {
  return Order.find({ user: userId }).sort({ createdAt: -1 }).lean() as unknown as Promise<IOrder[]>;
}

export async function getOrderById(orderId: string, userId: string): Promise<IOrder> {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) notFound('Order not found');
  return order as unknown as IOrder;
}

export async function cancelOrder(orderId: string, userId: string): Promise<IOrder> {
  // Atomically flip pending -> cancelled with the precondition baked into
  // the filter (rather than findOne -> check -> mutate -> .save()), so a
  // concurrent admin status change that already moved the order past
  // 'pending' loses this race cleanly instead of both this write AND the
  // stock-restore below proceeding on a now-stale assumption. Confirmed
  // live: forcing an admin's updateOrderStatus to land between this
  // function's old read and its save reproduced an order that read
  // "shipped" with its stock already credited back to inventory — a real
  // oversell vector.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, user: userId, status: 'pending' },
    { $set: { status: 'cancelled' } },
    { new: true }
  );

  if (!order) {
    if (!(await Order.exists({ _id: orderId, user: userId }))) notFound('Order not found');
    badRequest('Only pending orders can be cancelled');
  }

  // Restore stock only now that the cancellation is confirmed to have
  // atomically won — an order that lost the race above never reaches here.
  for (const item of order.items) {
    if (item.variant) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'variants._id': item.variant },
        { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity } }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  return order;
}

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export async function updateOrderStatus(
  orderId: string,
  status: string,
  userRole: string,
  tracking?: { trackingNumber?: string; carrier?: string }
): Promise<IOrder> {
  if (userRole !== 'admin') forbidden('Admin access required');
  if (!VALID_STATUSES.includes(status as any)) {
    badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const setFields: Record<string, unknown> = { status };
  if (tracking?.trackingNumber !== undefined) setFields.trackingNumber = tracking.trackingNumber.trim() || undefined;
  if (tracking?.carrier !== undefined) setFields.carrier = tracking.carrier.trim() || undefined;

  // Atomic conditional update (rather than findById -> mutate -> .save())
  // excluding an already-cancelled order from the match — the other half of
  // the cancelOrder race above. Without this, an admin's status write that
  // read the order just before a customer's concurrent cancellation could
  // still land afterward and silently overwrite it back to e.g. "shipped",
  // even though cancelOrder had already atomically won and returned its
  // stock to inventory.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: { $ne: 'cancelled' } },
    { $set: setFields },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findById(orderId).select('status');
    if (!existing) notFound('Order not found');
    badRequest('This order has been cancelled and its status can no longer be changed');
  }
  return order;
}

export async function getAllOrders(
  page = 1,
  limit = 20
): Promise<{ orders: IOrder[]; total: number; page: number; pages: number }> {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email').lean(),
    Order.countDocuments(),
  ]);
  return { orders: orders as unknown as IOrder[], total, page, pages: Math.ceil(total / limit) };
}

export interface Invoice {
  invoiceNumber: string;
  issuedAt: string;
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
  };
  customer: {
    id: string;
  };
  shippingAddress: IAddress;
  lineItems: Array<{
    name: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  total: number;
}

export async function getOrderInvoice(
  orderId: string,
  userId: string,
  userRole: string
): Promise<Invoice> {
  const query = userRole === 'admin' ? { _id: orderId } : { _id: orderId, user: userId };
  const order = await Order.findOne(query).lean();
  if (!order) notFound('Order not found');

  const lineItems = order.items.map((item) => ({
    name: item.name,
    unitPrice: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const subtotal = lineItems.reduce((sum, l) => sum + l.subtotal, 0);

  return {
    invoiceNumber: `INV-${(order._id as any).toString().slice(-8).toUpperCase()}`,
    issuedAt: (order.createdAt as Date).toISOString(),
    order: {
      id: (order._id as any).toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentDetails.method,
    },
    customer: {
      id: order.user.toString(),
    },
    shippingAddress: order.address,
    lineItems,
    subtotal,
    total: order.total,
  };
}
