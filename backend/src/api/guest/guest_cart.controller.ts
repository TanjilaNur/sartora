import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  createGuestSession,
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
  mergeGuestCartIntoUser,
  listGuestSessions,
  deleteGuestSession,
} from './guest_cart.service';

export async function initSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await createGuestSession();
    res.status(201).json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function fetchGuestCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await getGuestCart(req.params.guestId as string);
    res.json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function addGuestItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId, quantity = 1, variantId } = req.body as { productId: string; quantity?: number; variantId?: string };
    if (!productId) {
      res.status(400).json({ message: 'productId is required' });
      return;
    }
    const cart = await addToGuestCart(req.params.guestId as string, productId, quantity, variantId);
    res.status(201).json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function updateGuestItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quantity, variantId } = req.body as { quantity: number; variantId?: string };
    if (quantity === undefined) {
      res.status(400).json({ message: 'quantity is required' });
      return;
    }
    const cart = await updateGuestCartItem(req.params.guestId as string, req.params.productId as string, quantity, variantId);
    res.json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removeGuestItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variantId = req.query.variantId as string | undefined;
    const cart = await removeFromGuestCart(req.params.guestId as string, req.params.productId as string, variantId);
    res.json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function clearGuestCartHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clearGuestCart(req.params.guestId as string);
    res.json({ message: 'Guest cart cleared' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function mergeCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await mergeGuestCartIntoUser(req.params.guestId as string, req.user!.id);
    res.json({ message: 'Guest cart merged', cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function adminListSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await listGuestSessions(page, limit);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function adminDeleteSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteGuestSession(req.params.guestId as string);
    res.json({ message: 'Guest session deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
