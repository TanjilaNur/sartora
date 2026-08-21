import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateNotificationsEnabled, deleteMyAccount } from '../api/userApi';
import { errorMessage } from '../api/client';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifError, setNotifError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const notificationsEnabled = user?.notificationsEnabled ?? true;

  async function handleToggleNotifications(value: boolean) {
    if (!user) return;
    setNotifError('');
    try {
      const updated = await updateNotificationsEnabled(value);
      setUser({ ...user, notificationsEnabled: updated });
    } catch (err) {
      setNotifError(errorMessage(err, 'Failed to update notification preferences.'));
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMyAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(errorMessage(err, 'Could not delete account.'));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl font-bold text-textPrimary">Settings</h1>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-onPrimaryTint">Account</h2>
        <div className="flex flex-col gap-2">
          <NavRow to="/profile-edit" icon="👤" label="Edit Profile" sub="Name, email, and phone number" />
          <NavRow to="/addresses" icon="📍" label="My Addresses" sub="Manage your saved delivery addresses" />
          <NavRow to="/wishlist" icon="🤍" label="My Wishlist" sub="Products you've saved for later" />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-onPrimaryTint">Appearance</h2>
        <div className="flex items-center justify-between rounded-xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">🌙</span>
            <div>
              <p className="text-sm font-semibold text-textPrimary">Dark Mode</p>
              <p className="text-xs text-textSecondary">Switch between light and dark theme</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative h-6 w-11 rounded-full transition-colors ${isDark ? 'bg-primary dark:bg-secondary' : 'bg-neutral-300'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-onPrimaryTint">Notifications</h2>
        <div className="flex flex-col gap-2">
          <ToggleRow
            icon="🔔"
            label="Notifications"
            sub="Push notifications for orders and updates"
            checked={notificationsEnabled}
            onChange={handleToggleNotifications}
          />
        </div>
        {notifError && <p className="mt-2 text-sm text-danger">{notifError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-onPrimaryTint">About</h2>
        <div className="flex flex-col gap-2">
          <SettingsRow label="App Version" value="1.0.0" />
          <SettingsRow label="Store" value="Sartora" />
        </div>
      </section>

      <button
        onClick={handleLogout}
        className="rounded-lg border border-danger py-2.5 text-sm font-semibold text-danger"
      >
        Sign Out
      </button>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-danger">Danger Zone</h2>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full rounded-xl bg-surface p-4 text-left text-sm font-semibold text-danger shadow-card"
        >
          <span>Delete Account</span>
          <span className="mt-0.5 block text-xs font-normal text-textSecondary">Permanently deactivate your account</span>
        </button>
      </section>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-textPrimary">Delete account?</h2>
            <p className="mt-2 text-sm text-textSecondary">
              This deactivates your account and removes your personal information. Your order history is kept for
              records but you will not be able to sign in again. This cannot be undone.
            </p>
            {deleteError && <p className="mt-2 text-sm text-danger">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-textPrimary disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface p-4 shadow-card">
      <span className="text-sm font-semibold text-textPrimary">{label}</span>
      <span className="text-sm text-textSecondary">{value}</span>
    </div>
  );
}

function NavRow({ to, icon, label, sub }: { to: string; icon: string; label: string; sub: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl bg-surface p-4 shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-textPrimary">{label}</p>
        <p className="text-xs text-textSecondary">{sub}</p>
      </div>
      <span className="text-textSecondary">›</span>
    </Link>
  );
}

function ToggleRow({
  icon,
  label,
  sub,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-textPrimary">{label}</p>
          <p className="text-xs text-textSecondary">{sub}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary dark:bg-secondary' : 'bg-neutral-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
