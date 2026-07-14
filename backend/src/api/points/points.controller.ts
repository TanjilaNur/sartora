import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  getUserPointsHistory,
  getLeaderboard,
  getUserBadges,
  listBadges,
  createBadge,
  updateBadge,
  deleteBadge,
} from './points.service';

export async function getMyPoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getUserPointsHistory(req.user!.id, page, limit);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function leaderboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const result = await getLeaderboard(limit, req.user?.id);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getMyBadges(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getUserBadges(req.user!.id);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getAllBadges(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const badges = await listBadges();
    res.json({ badges });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function addBadge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const badge = await createBadge(req.body);
    res.status(201).json({ badge });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function editBadge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const badge = await updateBadge(req.params.badgeId as string, req.body);
    res.json({ badge });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removeBadge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteBadge(req.params.badgeId as string);
    res.json({ message: 'Badge deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
