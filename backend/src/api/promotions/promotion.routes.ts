import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  createPromo,
  listPromos,
  getPromo,
  updatePromo,
  deletePromo,
  validatePromo,
} from './promotion.controller';

const router = Router();

router.use(authenticate);

// User: validate a promo code before checkout
router.post('/validate', validatePromo);

// Admin CRUD
router.post('/', requireAdmin, createPromo);
router.get('/', requireAdmin, listPromos);
router.get('/:id', requireAdmin, getPromo);
router.put('/:id', requireAdmin, updatePromo);
router.delete('/:id', requireAdmin, deletePromo);

export default router;
