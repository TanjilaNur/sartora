import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  addReview,
  listProductReviews,
  listMyReviews,
  editReview,
  removeReview,
  flagReview,
  listReported,
} from './review.controller';

const router = Router();

// Public
router.get('/product/:productId', listProductReviews);

// Authenticated
router.use(authenticate);

// Admin — must be registered before /:reviewId to avoid route conflict
router.get('/admin/reported', requireAdmin, listReported);

router.get('/my', listMyReviews);
router.post('/product/:productId', addReview);
router.put('/:reviewId', editReview);
router.delete('/:reviewId', removeReview);
router.post('/:reviewId/report', flagReview);

export default router;
