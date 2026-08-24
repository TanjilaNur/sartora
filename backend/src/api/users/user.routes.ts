import { Router } from 'express';
import {
  listCustomersHandler,
  getCustomerProfileHandler,
  getMe,
  updateMe,
  deleteMe,
  listAddresses,
  addAddress,
  editAddress,
  removeAddress,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  updateMyNotificationPreferences,
  registerPushTokenHandler,
  unregisterPushTokenHandler,
} from './user.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth';

const router = Router();

// Self-service routes — registered ahead of the admin `/:userId` catch-all
// below, since `:userId` would otherwise greedily match the literal "me".
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.delete('/me', authenticate, deleteMe);
router.patch('/me/notification-preferences', authenticate, updateMyNotificationPreferences);
router.post('/me/push-token', authenticate, registerPushTokenHandler);
router.delete('/me/push-token', authenticate, unregisterPushTokenHandler);

router.get('/me/addresses', authenticate, listAddresses);
router.post('/me/addresses', authenticate, addAddress);
router.patch('/me/addresses/:addressId', authenticate, editAddress);
router.delete('/me/addresses/:addressId', authenticate, removeAddress);

router.get('/me/wishlist', authenticate, getWishlist);
router.post('/me/wishlist/:productId', authenticate, addWishlistItem);
router.delete('/me/wishlist/:productId', authenticate, removeWishlistItem);

// Admin — customer directory
router.get('/', authenticate, requireAdmin, listCustomersHandler);
router.get('/:userId', authenticate, requireAdmin, getCustomerProfileHandler);

export default router;
