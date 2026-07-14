import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { fetchCart, addItem, updateItem, removeItem, emptyCart } from './cart.controller';

const router = Router();

router.use(authenticate);

router.get('/', fetchCart);
router.post('/:productId', addItem);
router.put('/:productId', updateItem);
router.delete('/:productId', removeItem);
router.delete('/', emptyCart);

export default router;
