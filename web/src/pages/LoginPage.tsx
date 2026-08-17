import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

type Tab = 'email' | 'phone';

export default function LoginPage() {
  const { login, phoneLogin, loginWithGoogle, isLoading, errorMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = tab === 'email' ? await login(email, password) : await phoneLogin(phone, password);
    if (ok) navigate(from, { replace: true });
  }

  async function handleGoogleCredential(idToken: string) {
    const ok = await loginWithGoogle(idToken);
    if (ok) navigate(from, { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center py-8">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primaryTint text-3xl">🏬</span>
        <h1 className="text-2xl font-bold text-textPrimary">Sartora</h1>
        <p className="text-sm text-textSecondary">Sign in to your account</p>
      </div>

      <div className="w-full rounded-2xl bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-6 flex gap-6 border-b border-border">
          {(['email', 'phone'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-textSecondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'email' ? (
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
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-textPrimary">Phone Number</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-textPrimary">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <Link to="/forgot-password" className="-mt-2 self-end text-sm font-medium text-primary">
            Forgot password?
          </Link>

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase text-textSecondary">Or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />
      </div>

      <p className="mt-5 text-sm text-textSecondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary">
          Sign Up
        </Link>
      </p>
      <Link to="/" className="mt-2 text-sm text-textSecondary underline">
        Continue browsing as a guest
      </Link>
    </div>
  );
}
