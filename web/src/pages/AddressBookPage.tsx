import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { fetchMyAddresses, addMyAddress, updateMyAddress, deleteMyAddress } from '../api/userApi';
import { errorMessage } from '../api/client';
import type { Address, AddressInput } from '../types/user';
import { FullPageSpinner } from '../components/Spinner';

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Address | null | undefined>(undefined); // undefined = modal closed

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setAddresses(await fetchMyAddresses());
    } catch (err) {
      setError(errorMessage(err, 'Failed to load addresses.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Remove this address?')) return;
    try {
      setAddresses(await deleteMyAddress(id));
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete address.'));
    }
  }

  async function handleSetDefault(address: Address) {
    try {
      setAddresses(await updateMyAddress(address._id, { isDefault: true }));
    } catch (err) {
      setError(errorMessage(err, 'Failed to update address.'));
    }
  }

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-textPrimary">My Addresses</h1>
        <button
          onClick={() => setEditing(null)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          + Add Address
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {addresses.length === 0 ? (
        <p className="py-12 text-center text-sm text-textSecondary">No saved addresses yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((a) => (
            <div
              key={a._id}
              className={`rounded-xl bg-surface p-4 shadow-card ${a.isDefault ? 'border border-primary' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-textPrimary">{a.label}</span>
                    {a.isDefault && (
                      <span className="rounded bg-primaryTint px-2 py-0.5 text-[10px] font-bold text-onPrimaryTint">DEFAULT</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-textSecondary">
                    {a.street}, {a.city}, {a.state} {a.zip}, {a.country}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
                  <button onClick={() => setEditing(a)} className="font-semibold text-onPrimaryTint">
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a)} className="text-textSecondary hover:text-onPrimaryTint">
                      Set as default
                    </button>
                  )}
                  <button onClick={() => handleDelete(a._id)} className="text-danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <AddressFormModal
          existing={editing}
          onClose={() => setEditing(undefined)}
          onSaved={(updated) => {
            setAddresses(updated);
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}

function AddressFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing: Address | null;
  onClose: () => void;
  onSaved: (addresses: Address[]) => void;
}) {
  const [label, setLabel] = useState(existing?.label ?? 'Home');
  const [street, setStreet] = useState(existing?.street ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [state, setState] = useState(existing?.state ?? '');
  const [zip, setZip] = useState(existing?.zip ?? '');
  const [country, setCountry] = useState(existing?.country ?? 'US');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const input: AddressInput = { label, street, city, state, zip, country, isDefault };
    try {
      const result = existing ? await updateMyAddress(existing._id, input) : await addMyAddress(input);
      onSaved(result);
    } catch (err) {
      setError(errorMessage(err, 'Failed to save address.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-modal sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-textPrimary">{existing ? 'Edit Address' : 'Add Address'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Home, Work)"
            className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
          />
          <input
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Street Address"
            className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
            />
            <input
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP Code"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
            />
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-textPrimary">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-primary" />
            Set as default address
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-textPrimary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : existing ? 'Save Changes' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
