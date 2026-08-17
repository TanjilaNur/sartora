import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../api/users/user.model';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtSecret()) as { id: string; role: string };
    // A deleted account's refresh token is cleared (blocking a new access
    // token via /auth/refresh), but an access token issued just before
    // deletion is still cryptographically valid for up to its own 1h
    // lifetime — without this check it would keep working right up until
    // it expires, contradicting "you will not be able to sign in again".
    // Skipped in tests: controller-level tests sign tokens for user IDs
    // that only ever exist as mocks, never as real User documents (same
    // NODE_ENV==='test' bypass convention used for loginLimiter in
    // api/auth/auth.routes.ts).
    if (process.env.NODE_ENV !== 'test') {
      const user = await User.findById(payload.id).select('isDeleted').lean();
      if (!user || user.isDeleted) {
        res.status(401).json({ message: 'Token invalid or expired' });
        return;
      }
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}
