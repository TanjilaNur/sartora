import { Router } from 'express';
import { listCategories, addCategory, editCategory, removeCategory } from './category.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth';

const router = Router();

router.get('/', listCategories);
router.post('/', authenticate, requireAdmin, addCategory);
router.put('/:id', authenticate, requireAdmin, editCategory);
router.delete('/:id', authenticate, requireAdmin, removeCategory);

export default router;
