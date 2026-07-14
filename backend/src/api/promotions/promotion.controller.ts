import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  createPromotion,
  listPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromoCode,
} from './promotion.service';

export async function createPromo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, type, value, minOrderAmount, maxUses, perUserLimit, expiresAt } = req.body;
    const promo = await createPromotion({ code, type, value, minOrderAmount, maxUses, perUserLimit, expiresAt });
    res.status(201).json({ promotion: promo });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function listPromos(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const promotions = await listPromotions();
    res.json({ promotions });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getPromo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const promo = await getPromotionById(req.params.id as string);
    res.json({ promotion: promo });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function updatePromo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { active, maxUses, perUserLimit, expiresAt, minOrderAmount, value, type } = req.body;
    const promo = await updatePromotion(req.params.id as string, { active, maxUses, perUserLimit, expiresAt, minOrderAmount, value, type });
    res.json({ promotion: promo });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function deletePromo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deletePromotion(req.params.id as string);
    res.json({ message: 'Promotion deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function validatePromo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, orderTotal } = req.body as { code: string; orderTotal: number };
    if (orderTotal === undefined) {
      res.status(400).json({ message: 'orderTotal is required' });
      return;
    }
    const result = await validatePromoCode(code, req.user!.id, orderTotal);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
