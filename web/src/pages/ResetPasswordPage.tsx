import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/authApi';
import { errorMessage } from '../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const linkInvalid = !token || !email;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await resetPassword(email, token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(errorMessage(err, 'This reset link is invalid or has expired.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center py-8">
      <div className="w-full rounded-2xl bg-surface p-6 shadow-card sm:p-8">
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-3xl">✅</span>
            <h1 className="text-lg font-bold text-textPrimary">Password reset</h1>
            <p className="text-sm text-textSecondary">Your password has been updated. Redirecting you to sign in…</p>
          </div>
        ) : linkInvalid ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-3xl">⚠️</span>
            <h1 className="text-lg font-bold text-textPrimary">Invalid link</h1>
            <p className="text-sm text-textSecondary">
              This password reset link is missing required information. Please request a new one.
            </p>
            <Link to="/forgot-password" className="mt-3 text-sm font-semibold text-onPrimaryTint">
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-bold text-textPrimary">Set a new password</h1>
            <p className="mb-6 text-sm text-textSecondary">
              Choose a new password for <span className="font-semibold text-textPrimary">{email}</span>.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textPrimary">New Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textPrimary">Confirm Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
