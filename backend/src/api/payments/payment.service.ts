import mongoose from 'mongoose';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Cart } from '../cart/cart.model';
import { Product } from '../products/product.model';
import { Order, IAddress, IOrder } from '../orders/order.model';
import { Transaction, ITransaction } from './payment.model';
import { applyPromoCode } from '../promotions/promotion.service';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

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

function forbidden(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 403;
  throw err;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  amount: number;
  currency: string;
}

/** Restores the stock an order's items reserved — used both when a Stripe
 * payment never completes (created intent, but it failed or was abandoned)
 * and when a paid order is later refunded. */
async function restoreOrderStock(order: { items: any[] }): Promise<void> {
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
}

export async function createPaymentIntent(
  userId: string,
  address: IAddress,
  currency = 'usd',
  promoCode?: string
): Promise<PaymentIntentResult> {
  if (!address?.street || !address?.city || !address?.state || !address?.zip || !address?.country) {
    badRequest('address must include street, city, state, zip, and country');
  }

  const session = await mongoose.startSession();
  let createdOrder: IOrder | undefined;

  try {
    // Reserve stock atomically in a transaction, exactly like
    // order.service.ts::placeOrder — a Stripe PaymentIntent must never be
    // handed to the client (letting them authorize a real charge) against
    // stock nobody has actually reserved for them. Without this, two
    // concurrent checkouts on the last unit could each pass a stale
    // "is there stock" check, both get charged, and only one could
    // actually be fulfilled.
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);
      if (!cart || cart.items.length === 0) badRequest('Cart is empty');

      const orderItems: any[] = [];
      let total = 0;

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
          // $elemMatch (not two separate dot-path conditions) — see the
          // matching comment in order.service.ts's placeOrder for why.
          filter = { _id: product._id, variants: { $elemMatch: { _id: item.variant, stock: { $gte: item.quantity } } } };
          update = { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } };
        }

        const decremented = await Product.findOneAndUpdate(filter, update, { session });
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
            paymentDetails: { method: 'stripe' },
            paymentStatus: 'unpaid',
            status: 'pending',
          },
        ],
        { session }
      );

      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }

  const order = createdOrder!;
  const amountInCents = Math.round(order.total * 100);
  const idempotencyKey = `order-${order._id}-${uuidv4()}`;

  // The Stripe call happens outside the transaction (an external network
  // call doesn't belong inside a DB transaction) — if it throws, the stock
  // reservation and pending order already committed above must be released
  // rather than left holding stock hostage for an order with no PaymentIntent.
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await getStripe().paymentIntents.create(
      {
        amount: amountInCents,
        currency,
        metadata: {
          orderId: (order._id as any).toString(),
          userId,
        },
      },
      { idempotencyKey }
    );
  } catch (err) {
    await restoreOrderStock(order);
    await Order.findByIdAndUpdate(order._id, { status: 'cancelled', paymentStatus: 'failed' });
    throw err;
  }

  // Store PCI-safe transaction record
  await Transaction.create({
    order: order._id,
    user: userId,
    stripePaymentIntentId: paymentIntent.id,
    amount: amountInCents,
    currency,
    status: 'pending',
    idempotencyKey,
  });

  // Link payment intent to order
  order.paymentDetails = { method: 'stripe', stripePaymentIntentId: paymentIntent.id };
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    orderId: (order._id as any).toString(),
    amount: amountInCents,
    currency,
  };
}

export async function handleWebhookEvent(rawBody: Buffer, stripeSignature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
  } catch {
    const err = new Error('Webhook signature verification failed');
    (err as any).status = 400;
    throw err;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    await _handlePaymentSuccess(pi);
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    await _handlePaymentFailure(pi);
  }
  // Other event types are acknowledged but not acted on
}

async function _handlePaymentSuccess(pi: Stripe.PaymentIntent): Promise<void> {
  const transaction = await Transaction.findOne({ stripePaymentIntentId: pi.id });
  if (!transaction) return;

  const order = await Order.findById(transaction.order);
  if (!order) return;

  // Reconcile: verify amounts match
  if (pi.amount !== transaction.amount) {
    console.error(`[payment] Amount mismatch for PI ${pi.id}: expected ${transaction.amount}, got ${pi.amount}`);
    return;
  }

  // Stock was already reserved atomically when the PaymentIntent was
  // created (see createPaymentIntent) — nothing to decrement here, which
  // also means this handler is naturally safe against Stripe's documented
  // at-least-once webhook delivery (a duplicate success event just re-sets
  // the same paymentStatus/status instead of decrementing stock twice).
  await Cart.updateOne({ user: transaction.user }, { $set: { items: [] } });

  order.paymentStatus = 'paid';
  order.status = 'processing';
  await order.save();

  transaction.status = 'succeeded';
  await transaction.save();
}

async function _handlePaymentFailure(pi: Stripe.PaymentIntent): Promise<void> {
  const transaction = await Transaction.findOne({ stripePaymentIntentId: pi.id });
  if (!transaction) return;

  const order = await Order.findById(transaction.order);
  // Guarded on paymentStatus (not just "order exists") so a duplicate
  // failure webhook — Stripe explicitly doesn't guarantee exactly-once
  // delivery — can't restore the same reserved stock twice.
  if (order && order.paymentStatus !== 'failed') {
    await restoreOrderStock(order);
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    await order.save();
  }

  transaction.status = 'failed';
  await transaction.save();
}

/**
 * Actually processes a refund for an order: refunds the real charge via
 * Stripe (when the order was paid that way), restores the stock that was
 * decremented at purchase, and only then marks the order refunded/cancelled.
 * If the Stripe call fails, nothing else is touched — the order stays in
 * its prior state so a failed refund never gets silently reported as done.
 * Shared by the admin "Issue Refund" button and refund-request approval so
 * both paths actually move money instead of just flipping a status field.
 */
export async function processOrderRefund(orderId: string): Promise<ITransaction | null> {
  const order = await Order.findById(orderId);
  if (!order) notFound('Order not found');
  if (order.paymentStatus === 'refunded') badRequest('Order has already been refunded');

  let transaction: ITransaction | null = null;
  if (order.paymentDetails?.method === 'stripe') {
    transaction = await Transaction.findOne({ order: orderId });
    if (transaction) {
      const refund = await getStripe().refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
      });
      transaction.status = 'refunded';
      transaction.stripeRefundId = refund.id;
      await transaction.save();
    }
  }

  await restoreOrderStock(order);

  order.paymentStatus = 'refunded';
  order.status = 'cancelled';
  await order.save();

  return transaction;
}

export async function refundOrder(
  orderId: string,
  requestingUserId: string,
  requestingUserRole: string
): Promise<ITransaction> {
  if (requestingUserRole !== 'admin') forbidden('Admin access required');

  const order = await Order.findById(orderId).lean();
  if (!order) notFound('Order not found');
  if (order.paymentStatus !== 'paid') badRequest('Order is not in a paid state');

  const transaction = await processOrderRefund(orderId);
  if (!transaction) notFound('Transaction not found for this order');
  return transaction;
}

export async function getTransactionByOrderId(orderId: string, userId: string): Promise<ITransaction> {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) notFound('Order not found');

  const transaction = await Transaction.findOne({ order: orderId }).lean();
  if (!transaction) notFound('Transaction not found');

  return transaction as unknown as ITransaction;
}

export interface TransactionListResult {
  transactions: (ITransaction & { orderDoc?: any; userDoc?: any })[];
  total: number;
  page: number;
  pages: number;
}

export async function listAllTransactions(
  page = 1,
  limit = 10,
  status?: string
): Promise<TransactionListResult> {
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('order', 'total status paymentStatus address')
      .populate('user', 'name email')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return { transactions, total, page, pages: Math.ceil(total / limit) };
}
