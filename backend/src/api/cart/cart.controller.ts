import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from './cart.service';

export async function fetchCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await getCart(req.user!.id);
    res.json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function addItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quantity = 1, variantId } = req.body as { quantity?: number; variantId?: string };
    const cart = await addToCart(req.user!.id, req.params.productId as string, quantity, variantId);
    res.status(201).json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function updateItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quantity, variantId } = req.body as { quantity: number; variantId?: string };
    if (quantity === undefined) {
      res.status(400).json({ message: 'quantity is required' });
      return;
    }
    const cart = await updateCartItem(req.user!.id, req.params.productId as string, quantity, variantId);
    res.json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removeItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variantId = req.query.variantId as string | undefined;
    const cart = await removeFromCart(req.user!.id, req.params.productId as string, variantId);
    res.json({ cart });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function emptyCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await clearCart(req.user!.id);
    res.json({ message: 'Cart cleared' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
