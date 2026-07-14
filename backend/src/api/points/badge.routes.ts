import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { getAllBadges, getMyBadges, addBadge, editBadge, removeBadge } from './points.controller';

const router = Router();

// Public — list all badge definitions
router.get('/', getAllBadges);

// Authenticated
router.use(authenticate);
router.get('/my', getMyBadges);

// Admin
router.post('/', requireAdmin, addBadge);
router.put('/:badgeId', requireAdmin, editBadge);
router.delete('/:badgeId', requireAdmin, removeBadge);

export default router;
