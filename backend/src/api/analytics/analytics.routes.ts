import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { getDashboard } from './analytics.controller';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/dashboard', getDashboard);

export default router;
