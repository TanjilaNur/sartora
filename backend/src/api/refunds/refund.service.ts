import { Order } from '../orders/order.model';
import { RefundRequest, IRefundRequest } from './refund.model';
import { processOrderRefund } from '../payments/payment.service';

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

export async function createRefundRequest(
  orderId: string,
  userId: string,
  reason: string
): Promise<IRefundRequest> {
  if (!reason?.trim()) badRequest('reason is required');

  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) notFound('Order not found');

  // Allow refund request if order is paid (not already refunded or unpaid)
  if (order.paymentStatus === 'refunded') badRequest('Order has already been refunded');
  if (order.paymentStatus !== 'paid' && order.status !== 'delivered') {
    badRequest('Only paid orders are eligible for refund requests');
  }

  const existing = await RefundRequest.findOne({
    order: orderId,
    status: { $in: ['pending', 'approved'] },
  }).lean();
  if (existing) badRequest('A refund request already exists for this order');

  try {
    return await RefundRequest.create({ order: orderId, user: userId, reason: reason.trim() });
  } catch (err: any) {
    // Backstopped by the partial unique index on (order, status IN
    // [pending, approved]) — the check above can't close a race between
    // two concurrent "Request Refund" submissions for the same order.
    if (err.code === 11000) badRequest('A refund request already exists for this order');
    throw err;
  }
}

export async function getUserRefundRequest(orderId: string, userId: string): Promise<IRefundRequest> {
  const refund = await RefundRequest.findOne({ order: orderId, user: userId }).lean();
  if (!refund) notFound('Refund request not found');
  return refund as unknown as IRefundRequest;
}

export async function listAllRefundRequests(): Promise<IRefundRequest[]> {
  return RefundRequest.find().populate('order user').sort({ createdAt: -1 }).lean() as unknown as Promise<IRefundRequest[]>;
}

export async function approveRefundRequest(refundId: string): Promise<IRefundRequest> {
  const refund = await RefundRequest.findById(refundId);
  if (!refund) notFound('Refund request not found');
  if (refund.status !== 'pending') badRequest('Only pending refund requests can be approved');

  // Only mark this approved once the refund has actually gone through —
  // if the Stripe call fails, the request stays pending and the order
  // stays paid, instead of lying about a refund that never happened.
  await processOrderRefund(refund.order.toString());

  refund.status = 'approved';
  await refund.save();

  return refund;
}

export async function rejectRefundRequest(
  refundId: string,
  adminNote?: string
): Promise<IRefundRequest> {
  const refund = await RefundRequest.findById(refundId);
  if (!refund) notFound('Refund request not found');
  if (refund.status !== 'pending') badRequest('Only pending refund requests can be rejected');

  refund.status = 'rejected';
  if (adminNote?.trim()) refund.adminNote = adminNote.trim();
  await refund.save();

  return refund;
}
