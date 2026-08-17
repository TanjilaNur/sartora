import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../api/userApi';
import { errorMessage } from '../api/client';

export default function ProfileEditPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await updateMyProfile({ name, email, phone });
      setUser(updated);
      navigate('/settings');
    } catch (err) {
      setError(errorMessage(err, 'Could not update profile.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-textPrimary">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-card">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-textPrimary">Full Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-textPrimary">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-textPrimary">Phone Number</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-textPrimary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
