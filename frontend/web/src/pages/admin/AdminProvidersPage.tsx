import { FormEvent, useEffect, useState } from 'react';
import {
  listProviders,
  setProviderStatus,
  updateProvider,
} from '@/api/admin';
import { useAdminAuth } from '@/admin/AdminAuthContext';
import type { ProviderProfile } from '@/types/admin';

type ProviderForm = {
  contact_email?: string;
  phone_number?: string;
  website?: string;
  description?: string;
  address?: string;
};

const STATUSES: ProviderProfile['status'][] = ['pending', 'approved', 'disabled', 'rejected'];

export default function AdminProvidersPage() {
  const { admin } = useAdminAuth();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProviderProfile['status'] | 'all'>('all');
  const [selected, setSelected] = useState<ProviderProfile | null>(null);
  const [form, setForm] = useState<ProviderForm>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listProviders({
        status: filter === 'all' ? undefined : filter,
        page_size: 50,
      });
      setProviders(data.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const selectProvider = (provider: ProviderProfile) => {
    setSelected(provider);
    setForm({
      contact_email: provider.contact_email ?? '',
      phone_number: provider.phone_number ?? '',
      website: provider.website ?? '',
      description: provider.description ?? '',
      address: provider.address ?? '',
    });
  };

  const submitDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateProvider(selected.id, form);
      await load();
      selectProvider(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (provider: ProviderProfile, status: ProviderProfile['status']) => {
    setSaving(true);
    try {
      await setProviderStatus(provider.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-providers">
      <header className="admin-section-head">
        <div>
          <h1>Provider directory</h1>
          <p className="muted">Review and approve provider applications.</p>
        </div>
        <label>
          <span className="sr-only">Filter status</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="provider-layout">
        <div className="provider-list">
          {loading ? (
            <p>Loading…</p>
          ) : (
            <ul>
              {providers.map((provider) => (
                <li key={provider.id}>
                  <button
                    type="button"
                    className={selected?.id === provider.id ? 'active' : undefined}
                    onClick={() => selectProvider(provider)}
                  >
                    <span className="name">{provider.display_name}</span>
                    <span className={`status ${provider.status}`}>{provider.status}</span>
                  </button>
                </li>
              ))}
              {providers.length === 0 && <li>No providers found.</li>}
            </ul>
          )}
        </div>

        <div className="provider-detail">
          {selected ? (
            <div>
              <header>
                <h2>{selected.display_name}</h2>
                <p className="muted">
                  Managed by {selected.user?.email ?? 'unknown owner'}
                </p>
              </header>

              <div className="status-actions">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`chip ${selected.status === status ? 'active' : ''}`}
                    onClick={() => changeStatus(selected, status)}
                    disabled={saving || (admin?.profile.role === 'moderator' && !['approved', 'disabled', 'rejected'].includes(status))}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <form className="stack" onSubmit={submitDetails}>
                <label>
                  <span>Contact email</span>
                  <input
                    type="email"
                    value={form.contact_email ?? ''}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    value={form.phone_number ?? ''}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  />
                </label>
                <label>
                  <span>Website</span>
                  <input
                    value={form.website ?? ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </label>
                <label>
                  <span>Address</span>
                  <input
                    value={form.address ?? ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                  />
                </label>

                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Save provider details'}
                </button>
              </form>
            </div>
          ) : (
            <p>Select a provider to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
