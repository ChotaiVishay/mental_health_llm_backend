import { FormEvent, useEffect, useState } from 'react';
import {
  createAdminAccount,
  deleteAdminAccount,
  listAdmins,
  updateAdminAccount,
} from '@/api/admin';
import { useAdminAuth } from '@/admin/AdminAuthContext';
import type { AdminUser } from '@/types/admin';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'super_admin', label: 'Super admin' },
] as const;

const ROLE_LABELS: Record<typeof ROLES[number]['value'], string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  super_admin: 'Super admin',
};

type FormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: typeof ROLES[number]['value'];
};

const DEFAULT_FORM: FormState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role: 'admin',
};

export default function AdminAdminsPage() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = admin?.profile.role === 'super_admin';

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAdmins({ page_size: 50 });
      setAdmins(data.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!isSuperAdmin) {
    return (
      <section className="admin-admins admin-page">
        <header className="admin-page__hero">
          <div>
            <p className="admin-page__eyebrow">Admin access</p>
            <h1>Administrator access</h1>
            <p className="admin-page__lede">Only super administrators may manage admin accounts.</p>
          </div>
        </header>
      </section>
    );
  }

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',
      role: user.profile.role as FormState['role'],
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateAdminAccount(editingId, {
          username: form.username,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        });
      } else {
        await createAdminAccount(form);
      }
      await load();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this administrator?')) return;
    setSaving(true);
    try {
      await deleteAdminAccount(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete administrator');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-admins admin-page">
      <header className="admin-page__hero">
        <div>
          <p className="admin-page__eyebrow">Admin access</p>
          <h1>Invite administrators with care</h1>
          <p className="admin-page__lede">Grant access to teammates who safeguard our community and data.</p>
        </div>
      </header>

      {error && (
        <div className="admin-page__alert" role="alert">
          <span className="admin-page__alert-label">We hit a snag:</span> {error}
        </div>
      )}

      <div className="admin-page__grid admin-admins__grid">
        <section className="admin-page__panel admin-admins__panel admin-admins__panel--form">
          <header className="admin-page__panel-head">
            <div>
              <h2>{editingId ? 'Update administrator' : 'Invite administrator'}</h2>
              <p className="muted">
                {editingId
                  ? 'Tidy up a colleague profile or adjust their access.'
                  : 'Send a temporary password they can change on first sign-in.'}
              </p>
            </div>
          </header>

          <form className="admin-page__form" onSubmit={submit} noValidate>
            <div className="admin-page__field-grid">
              <label htmlFor="admin-admin-username">
                <span>Username</span>
                <input
                  id="admin-admin-username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoComplete="username"
                />
              </label>
              <label htmlFor="admin-admin-email">
                <span>Email</span>
                <input
                  id="admin-admin-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </label>
            </div>

            <div className="admin-page__field-grid">
              <label htmlFor="admin-admin-firstname">
                <span>First name</span>
                <input
                  id="admin-admin-firstname"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  autoComplete="given-name"
                />
              </label>
              <label htmlFor="admin-admin-lastname">
                <span>Last name</span>
                <input
                  id="admin-admin-lastname"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label htmlFor="admin-admin-role">
              <span>Role</span>
              <select
                id="admin-admin-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>

            {!editingId && (
              <label htmlFor="admin-admin-password">
                <span>Temporary password</span>
                <input
                  id="admin-admin-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </label>
            )}

            <div className="admin-page__actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create admin'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-page__panel admin-admins__panel admin-admins__panel--list">
          <header className="admin-page__panel-head">
            <div>
              <h2>Administrators</h2>
              <p className="muted">We show the latest 50 accounts for quick updates.</p>
            </div>
          </header>
          {loading ? (
            <p className="admin-page__empty">Loading administrators...</p>
          ) : admins.length ? (
            <div className="table-wrapper">
              <table>
                <caption className="sr-only">Existing administrators and their access level</caption>
                <thead>
                  <tr>
                    <th scope="col">Username</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Last login</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {admins.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{ROLE_LABELS[user.profile.role as FormState['role']] ?? user.profile.role}</td>
                      <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Not yet'}</td>
                      <td>
                        <div className="admin-page__table-actions">
                          <button
                            type="button"
                            className="admin-page__table-link"
                            onClick={() => startEdit(user)}
                          >
                            Edit
                          </button>
                          {admin?.id !== user.id && (
                            <button
                              type="button"
                              className="admin-page__table-link admin-page__table-link--danger"
                              onClick={() => remove(user.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-page__empty">No administrator accounts yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
