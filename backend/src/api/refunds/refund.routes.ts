import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  requestRefund,
  fetchUserRefundRequest,
  listRefundRequests,
  approveRefund,
  rejectRefund,
} from './refund.controller';

const router = Router();

router.use(authenticate);

// User: create and view their refund request for a specific order
router.post('/:orderId', requestRefund);
router.get('/my/:orderId', fetchUserRefundRequest);

// Admin: list all, approve, reject
router.get('/', requireAdmin, listRefundRequests);
router.put('/:refundId/approve', requireAdmin, approveRefund);
router.put('/:refundId/reject', requireAdmin, rejectRefund);

export default router;
