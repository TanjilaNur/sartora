import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  checkout,
  listOrders,
  fetchOrder,
  cancelOrderHandler,
  updateStatus,
  listAllOrders,
  getInvoice,
} from './order.controller';

const router = Router();

router.use(authenticate);

// Admin-only: list all orders (must be before /:orderId to avoid conflict)
router.get('/admin/all', requireAdmin, listAllOrders);

router.post('/', checkout);
router.get('/', listOrders);
router.get('/:orderId', fetchOrder);
router.post('/:orderId/cancel', cancelOrderHandler);
router.put('/:orderId/status', requireAdmin, updateStatus);
router.get('/:orderId/invoice', getInvoice);

export default router;
