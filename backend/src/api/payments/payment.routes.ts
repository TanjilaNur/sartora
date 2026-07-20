import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { initiatePayment, stripeWebhook, refund, fetchTransaction, listTransactions } from './payment.controller';

const router = Router();

// Webhook: no JWT auth — Stripe signature validates authenticity
// Raw body is applied in server.ts before this router
router.post('/webhook', stripeWebhook);

router.use(authenticate);

router.get('/admin/all', requireAdmin, listTransactions);
router.post('/intent', initiatePayment);
router.get('/transaction/:orderId', fetchTransaction);
router.post('/refund/:orderId', requireAdmin, refund);

export default router;
