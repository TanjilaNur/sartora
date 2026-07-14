import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  reportReview,
  getReportedReviews,
} from './review.service';

export async function addReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rating, text } = req.body as { rating: number; text?: string };
    const review = await createReview(req.user!.id, req.params.productId as string, rating, text ?? '');
    res.status(201).json({ review });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listProductReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getProductReviews(req.params.productId as string, page, limit);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listMyReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await getUserReviews(req.user!.id);
    res.json({ reviews });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function editReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rating, text } = req.body as { rating?: number; text?: string };
    const review = await updateReview(req.params.reviewId as string, req.user!.id, rating, text);
    res.json({ review });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removeReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteReview(req.params.reviewId as string, req.user!.id, req.user!.role);
    res.json({ message: 'Review deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function flagReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const review = await reportReview(req.params.reviewId as string, req.user!.id);
    res.json({ message: 'Review reported', review });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listReported(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await getReportedReviews();
    res.json({ reviews });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
