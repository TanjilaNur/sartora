import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  loginWithPhone,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  loginWithGoogle,
} from './auth.service';

function sanitizeUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hasGoogleAccount: !!user.googleId,
  };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone } = req.body as {
      name: string;
      email: string;
      password: string;
      phone: string;
    };

    if (!name || !email || !password || !phone) {
      res.status(400).json({ message: 'name, email, password, and phone are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const { user, accessToken, refreshToken } = await registerUser({ name, email, password, phone });

    console.log(`[auth] register success: ${email}`);
    res.status(201).json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    const { user, accessToken, refreshToken } = await loginUser({ email, password });

    console.log(`[auth] login success: ${email}`);
    res.json({
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    if (err.status) {
      console.log(`[auth] login failed: ${req.body?.email}`);
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      res.status(400).json({ message: 'refreshToken is required' });
      return;
    }

    const { accessToken } = await refreshAccessToken(refreshToken);
    res.json({ token: accessToken });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function phoneLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, password } = req.body as { phone: string; password: string };

    if (!phone || !password) {
      res.status(400).json({ message: 'phone and password are required' });
      return;
    }

    const { user, accessToken, refreshToken } = await loginWithPhone({ phone, password });

    console.log(`[auth] phone login success: ${phone}`);
    res.json({
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    if (err.status) {
      console.log(`[auth] phone login failed: ${req.body?.phone}`);
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    await logoutUser(userId);
    console.log(`[auth] logout: user ${userId}`);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ message: 'email is required' });
      return;
    }
    await requestPasswordReset(email);
    // Same response whether or not the account exists — see the comment in
    // requestPasswordReset for why.
    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function performPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, token, password } = req.body as { email: string; token: string; password: string };
    if (!email || !token || !password) {
      res.status(400).json({ message: 'email, token, and password are required' });
      return;
    }
    await resetPassword(email, token, password);
    res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body as { idToken: string };
    if (!idToken) {
      res.status(400).json({ message: 'idToken is required' });
      return;
    }
    const { user, accessToken, refreshToken } = await loginWithGoogle(idToken);
    console.log(`[auth] google login success: ${user.email}`);
    res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
