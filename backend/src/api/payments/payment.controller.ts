import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  createPaymentIntent,
  handleWebhookEvent,
  refundOrder,
  getTransactionByOrderId,
  listAllTransactions,
} from './payment.service';

export async function initiatePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { address, currency, promoCode } = req.body as { address: any; currency?: string; promoCode?: string };
    if (!address) {
      res.status(400).json({ message: 'address is required' });
      return;
    }
    const result = await createPaymentIntent(req.user!.id, address, currency, promoCode);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
      res.status(400).json({ message: 'Missing stripe-signature header' });
      return;
    }
    await handleWebhookEvent(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function refund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await refundOrder(req.params.orderId as string, req.user!.id, req.user!.role);
    res.json({ message: 'Refund initiated', refundId: transaction.stripeRefundId, status: transaction.status });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const result = await listAllTransactions(page, limit, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function fetchTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await getTransactionByOrderId(req.params.orderId as string, req.user!.id);
    res.json({
      transaction: {
        orderId: transaction.order,
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
