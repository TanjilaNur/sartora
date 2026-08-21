import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../users/user.model';
import { awardPoints } from '../points/points.service';
import { sendMail } from '../../utils/mailer';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function badRequest(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 400;
  throw err;
}

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

function jwtRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || jwtSecret() + '_refresh';
}

export function generateAccessToken(user: IUser): string {
  return jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret(),
    { expiresIn: '1h' }
  );
}

export function generateRefreshToken(user: IUser): string {
  return jwt.sign(
    { id: user._id },
    jwtRefreshSecret(),
    { expiresIn: '7d' }
  );
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    const err = new Error('Email already registered');
    (err as any).status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
  let user: IUser;
  try {
    user = await User.create({ ...data, password: hashed });
  } catch (err: any) {
    // Backstopped by the unique index on email/phone — a race between two
    // concurrent registrations (e.g. an impatient double-click) loses the
    // findOne-then-create check above, so the DB constraint is what
    // actually prevents the duplicate; translate its raw error into the
    // same friendly message instead of letting a 500 through.
    if (err.code === 11000) {
      const dup = new Error('Email already registered');
      (dup as any).status = 409;
      throw dup;
    }
    throw err;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  awardPoints((user._id as any).toString(), 'signup').catch((err) =>
    console.error(`[points] Failed to award signup points for user ${user._id}:`, err)
  );

  return { user, accessToken, refreshToken };
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const user = await User.findOne({ email: data.email.toLowerCase(), isDeleted: { $ne: true } });
  // Generic message to avoid leaking user existence
  const invalid = new Error('Invalid credentials');
  (invalid as any).status = 401;

  if (!user) throw invalid;

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) throw invalid;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(
  token: string
): Promise<{ accessToken: string }> {
  let payload: any;
  try {
    payload = jwt.verify(token, jwtRefreshSecret());
  } catch {
    const err = new Error('Invalid or expired refresh token');
    (err as any).status = 401;
    throw err;
  }

  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) {
    const err = new Error('Refresh token revoked');
    (err as any).status = 401;
    throw err;
  }

  return { accessToken: generateAccessToken(user) };
}

export async function loginWithPhone(data: {
  phone: string;
  password: string;
}): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const user = await User.findOne({ phone: data.phone.trim(), isDeleted: { $ne: true } });
  const invalid = new Error('Invalid credentials');
  (invalid as any).status = 401;

  if (!user) throw invalid;

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) throw invalid;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
}

export async function logoutUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

// ── Forgot / reset password ─────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
  // Always resolve the same way whether or not the account exists, so this
  // endpoint can't be used to probe which emails are registered.
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  // Only the hash is persisted — a database leak alone can't be used to
  // reset anyone's password, since the raw token (the only usable form)
  // only ever exists in the emailed link.
  user.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const resetUrl = `${process.env.WEB_URL || 'http://localhost:4002'}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendMail(
    user.email,
    'Reset your Sartora password',
    `<p>Hi ${user.name},</p>
     <p>Click the link below to reset your password. This link expires in 1 hour.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  if (!token) badRequest('Reset token is required');
  if (!newPassword || newPassword.length < 8) badRequest('Password must be at least 8 characters');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Atomic find-and-consume rather than find -> check -> clear -> .save():
  // the token's validity check and its consumption were two separate steps,
  // so two concurrent requests with the SAME valid token (a double-submit,
  // or someone racing the legitimate user with an intercepted link) could
  // both pass the check before either cleared the hash — confirmed live,
  // both calls succeeded and the token was effectively reusable, with
  // whichever .save() landed last silently discarding the other's password.
  // Folding the check into the update's filter means only the request that
  // actually wins the atomic write can ever match.
  const user = await User.findOneAndUpdate(
    {
      email: email.toLowerCase(),
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    },
    {
      $set: { password: newHash },
      $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1, refreshToken: 1 },
    }
  );

  if (!user) badRequest('This reset link is invalid or has expired');
}

// ── Google Sign-In ───────────────────────────────────────────────────────────

let _googleClient: OAuth2Client | null = null;
function googleClient(): OAuth2Client {
  if (!_googleClient) _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return _googleClient;
}

export async function loginWithGoogle(
  idToken: string
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('Google Sign-In is not configured on this server');
    (err as any).status = 501;
    throw err;
  }

  let payload;
  try {
    const ticket = await googleClient().verifyIdToken({ idToken, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    badRequest('Invalid Google token');
  }
  if (!payload?.email) badRequest('Invalid Google token');

  const googleId = payload!.sub;
  const email = payload!.email!.toLowerCase();

  let user = await User.findOne({ $or: [{ googleId }, { email }], isDeleted: { $ne: true } });

  if (!user) {
    // First time this Google account has signed in and no existing email
    // match — provision an account. It has no usable password (only
    // Google can authenticate it), so a random, never-disclosed hash fills
    // the required `password` field without weakening anything else that
    // assumes a user always has one.
    const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), SALT_ROUNDS);
    try {
      user = await User.create({
        name: payload!.name || email.split('@')[0],
        email,
        phone: `google-${googleId}`,
        password: randomPassword,
        googleId,
      });
    } catch (err: any) {
      // Same email/googleId unique-index race as registerUser — but unlike
      // registration, the caller's intent here is "log me in", and by the
      // time this fires the account DOES exist (the concurrent request that
      // won created it), so recover by re-fetching and logging in as it
      // instead of erroring. Confirmed live: two concurrent first-time
      // sign-ins for the same brand-new Google account both called
      // create(), the loser threw an uncaught E11000 that surfaced as a
      // raw 500 instead of this retryable race being handled gracefully.
      if (err.code !== 11000) throw err;
      user = await User.findOne({ $or: [{ googleId }, { email }], isDeleted: { $ne: true } });
      if (!user) throw err;
    }
    awardPoints((user._id as any).toString(), 'signup').catch((err) =>
      console.error(`[points] Failed to award signup points for user ${user!._id}:`, err)
    );
  } else if (!user.googleId) {
    // An account with this email already exists (registered the normal
    // way) — link it rather than creating a duplicate account.
    user.googleId = googleId;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
}
