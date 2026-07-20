import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  initSession,
  fetchGuestCart,
  addGuestItem,
  updateGuestItem,
  removeGuestItem,
  clearGuestCartHandler,
  mergeCart,
  adminListSessions,
  adminDeleteSession,
} from './guest_cart.controller';

const router = Router();

// Create a new guest session
router.post('/session', initSession);

// Guest cart CRUD (no auth required)
router.get('/cart/:guestId', fetchGuestCart);
router.post('/cart/:guestId/items', addGuestItem);
router.put('/cart/:guestId/items/:productId', updateGuestItem);
router.delete('/cart/:guestId/items/:productId', removeGuestItem);
router.delete('/cart/:guestId', clearGuestCartHandler);

// Merge guest cart into authenticated user cart (auth required)
router.post('/cart/:guestId/merge', authenticate, mergeCart);

// Admin routes
router.get('/admin/sessions', authenticate, requireAdmin, adminListSessions);
router.delete('/admin/sessions/:guestId', authenticate, requireAdmin, adminDeleteSession);

export default router;
