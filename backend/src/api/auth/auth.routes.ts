import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  phoneLogin,
  refresh,
  logout,
  forgotPassword,
  performPasswordReset,
  googleLogin,
} from './auth.controller';
import { authenticate } from '../../middlewares/auth';

const loginLimiter = process.env.NODE_ENV === 'test'
  ? (_req: Request, _res: Response, next: NextFunction) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

const router = Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/phone-login', loginLimiter, phoneLogin);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', loginLimiter, performPasswordReset);
router.post('/google', loginLimiter, googleLogin);

export default router;
