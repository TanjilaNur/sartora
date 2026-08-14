import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, isLoading, errorMessage } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await register({ name, email, password, phone });
    if (ok) navigate('/', { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center py-8">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primaryTint text-3xl">🏬</span>
        <h1 className="text-2xl font-bold text-textPrimary">Create an Account</h1>
        <p className="text-sm text-textSecondary">Join Sartora to start shopping</p>
      </div>

      <div className="w-full rounded-2xl bg-surface p-6 shadow-card sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-textPrimary">Full Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
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
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-textPrimary">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
      </div>

      <p className="mt-5 text-sm text-textSecondary">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Sign In
        </Link>
      </p>
    </div>
  );
}
