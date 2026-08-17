import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderInvoice,
} from './order.service';

export async function checkout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { address, paymentDetails, promoCode } = req.body as {
      address: any;
      paymentDetails: { method: string; transactionId?: string };
      promoCode?: string;
    };

    if (!address) {
      res.status(400).json({ message: 'address is required' });
      return;
    }
    if (!paymentDetails) {
      res.status(400).json({ message: 'paymentDetails is required' });
      return;
    }

    const order = await placeOrder(req.user!.id, address, paymentDetails, promoCode);
    res.status(201).json({
      orderId: order._id,
      subtotal: order.subtotal,
      discount: order.discount,
      promoCode: order.promoCode,
      total: order.total,
      items: order.items,
      status: order.status,
    });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await getUserOrders(req.user!.id);
    res.json({ orders });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function fetchOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await getOrderById(req.params.orderId as string, req.user!.id);
    res.json({ order });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function cancelOrderHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await cancelOrder(req.params.orderId as string, req.user!.id);
    res.json({ message: 'Order cancelled', order });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, trackingNumber, carrier } = req.body as {
      status: string;
      trackingNumber?: string;
      carrier?: string;
    };
    if (!status) {
      res.status(400).json({ message: 'status is required' });
      return;
    }
    const order = await updateOrderStatus(req.params.orderId as string, status, req.user!.role, {
      trackingNumber,
      carrier,
    });
    res.json({ message: 'Order status updated', order });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getAllOrders(page, limit);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await getOrderInvoice(req.params.orderId as string, req.user!.id, req.user!.role);
    res.json({ invoice });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
