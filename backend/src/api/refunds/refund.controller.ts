import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  createRefundRequest,
  getUserRefundRequest,
  listAllRefundRequests,
  approveRefundRequest,
  rejectRefundRequest,
} from './refund.service';

function handle(err: any, res: Response, next: NextFunction): void {
  if (err.status) res.status(err.status).json({ message: err.message });
  else next(err);
}

export async function requestRefund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body as { reason: string };
    if (!reason) {
      res.status(400).json({ message: 'reason is required' });
      return;
    }
    const refund = await createRefundRequest(req.params.orderId as string, req.user!.id, reason);
    res.status(201).json({ refund });
  } catch (err: any) {
    handle(err, res, next);
  }
}

export async function fetchUserRefundRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const refund = await getUserRefundRequest(req.params.orderId as string, req.user!.id);
    res.json({ refund });
  } catch (err: any) {
    handle(err, res, next);
  }
}

export async function listRefundRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const refunds = await listAllRefundRequests();
    res.json({ refunds });
  } catch (err: any) {
    handle(err, res, next);
  }
}

export async function approveRefund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const refund = await approveRefundRequest(req.params.refundId as string);
    res.json({ message: 'Refund request approved', refund });
  } catch (err: any) {
    handle(err, res, next);
  }
}

export async function rejectRefund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { adminNote } = req.body as { adminNote?: string };
    const refund = await rejectRefundRequest(req.params.refundId as string, adminNote);
    res.json({ message: 'Refund request rejected', refund });
  } catch (err: any) {
    handle(err, res, next);
  }
}
