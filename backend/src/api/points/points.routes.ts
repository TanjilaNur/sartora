import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getMyPoints, leaderboard } from './points.controller';

const router = Router();

router.use(authenticate);
router.get('/me', getMyPoints);
router.get('/leaderboard', leaderboard);

export default router;
