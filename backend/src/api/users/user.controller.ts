import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  listCustomers,
  getCustomerProfile,
  getMyProfile,
  updateMyProfile,
  deactivateMyAccount,
  listMyAddresses,
  addMyAddress,
  updateMyAddress,
  deleteMyAddress,
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  updateNotificationPreferences,
  registerPushToken,
  unregisterPushToken,
} from './user.service';

function handleError(err: any, res: Response, next: NextFunction): void {
  if (err.status) res.status(err.status).json({ message: err.message });
  else next(err);
}

export async function listCustomersHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, page, limit } = req.query as Record<string, string>;
    const result = await listCustomers({
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerProfileHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await getCustomerProfile(req.params.userId as string);
    res.json(profile);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

// ── Self-service profile ────────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ user: await getMyProfile(req.user!.id) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string };
    res.json({ user: await updateMyProfile(req.user!.id, { name, email, phone }) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function deleteMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deactivateMyAccount(req.user!.id);
    res.json({ message: 'Account deactivated' });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

// ── Address book ─────────────────────────────────────────────────────────────

export async function listAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ addresses: await listMyAddresses(req.user!.id) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function addAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ addresses: await addMyAddress(req.user!.id, req.body) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function editAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ addresses: await updateMyAddress(req.user!.id, req.params.addressId as string, req.body) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function removeAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ addresses: await deleteMyAddress(req.user!.id, req.params.addressId as string) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export async function getWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ wishlist: await getMyWishlist(req.user!.id) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function addWishlistItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await addToWishlist(req.user!.id, req.params.productId as string);
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function removeWishlistItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeFromWishlist(req.user!.id, req.params.productId as string);
    res.json({ message: 'Removed from wishlist' });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

// ── Notification preferences ────────────────────────────────────────────────

export async function updateMyNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ notificationsEnabled: await updateNotificationPreferences(req.user!.id, req.body) });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

// ── Push notification tokens ────────────────────────────────────────────────

export async function registerPushTokenHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, platform } = req.body as { token?: string; platform?: string };
    await registerPushToken(req.user!.id, { token: token ?? '', platform: platform as any });
    res.status(201).json({ message: 'Push token registered' });
  } catch (err: any) {
    handleError(err, res, next);
  }
}

export async function unregisterPushTokenHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body as { token?: string };
    await unregisterPushToken(req.user!.id, token ?? '');
    res.json({ message: 'Push token unregistered' });
  } catch (err: any) {
    handleError(err, res, next);
  }
}
