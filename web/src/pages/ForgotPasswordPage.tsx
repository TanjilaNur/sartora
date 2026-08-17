import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/authApi';
import { errorMessage } from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center py-8">
      <div className="w-full rounded-2xl bg-surface p-6 shadow-card sm:p-8">
        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-3xl">✉️</span>
            <h1 className="text-lg font-bold text-textPrimary">Check your email</h1>
            <p className="text-sm text-textSecondary">
              If an account exists for <span className="font-semibold text-textPrimary">{email.trim()}</span>, we've
              sent a link to reset your password. Open it on any device to finish resetting.
            </p>
            <Link to="/login" className="mt-3 text-sm font-semibold text-onPrimaryTint">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-bold text-textPrimary">Reset Password</h1>
            <p className="mb-6 text-sm text-textSecondary">
              Enter the email on your account and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textPrimary">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>

      {!sent && (
        <Link to="/login" className="mt-5 text-sm text-textSecondary hover:text-onPrimaryTint">
          Back to Sign In
        </Link>
      )}
    </div>
  );
}
