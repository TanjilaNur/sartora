import { Router } from 'express';
import multer from 'multer';
import {
  listProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct,
  exportProducts,
  importProducts,
} from './product.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// Static paths must come before the `/:productId` wildcard below, or Express
// would match `/export` as a product ID lookup.
router.get('/export', authenticate, requireAdmin, exportProducts);
router.post('/import', authenticate, requireAdmin, upload.single('file'), importProducts);

router.get('/', listProducts);
router.get('/:productId', getProduct);
router.post('/', authenticate, requireAdmin, addProduct);
router.put('/:productId', authenticate, requireAdmin, editProduct);
router.delete('/:productId', authenticate, requireAdmin, removeProduct);

export default router;
