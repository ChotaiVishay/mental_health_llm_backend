import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createUser, deleteUser, listUsers, updateUser } from '@/api/admin';
import { useAdminAuth } from '@/admin/AdminAuthContext';
import type { AdminRole, AdminUser } from '@/types/admin';

type FormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  password?: string;
};

const DEFAULT_FORM: FormState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'user',
  password: '',
};

const ADMIN_ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'user', label: 'Service user' },
  { value: 'provider', label: 'Provider' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  user: 'Service user',
  provider: 'Provider',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super admin',
};

export default function AdminUsersPage() {
  const { admin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManageAdmins = admin?.profile.role === 'super_admin';

  const roleOptions = useMemo(() => {
    if (canManageAdmins) return ADMIN_ROLE_OPTIONS;
    return ADMIN_ROLE_OPTIONS.filter((opt) => !['admin', 'super_admin', 'moderator'].includes(opt.value));
  }, [canManageAdmins]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers({ search: search.trim() || undefined, page_size: 50 });
      setUsers(data.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.profile.role,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateUser(editingId, {
          username: form.username,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          is_active: true,
          role: form.role,
        });
      } else {
        await createUser({
          ...form,
          password: form.password ?? '',
          role: form.role,
        });
      }
      await fetchUsers();
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    setSaving(true);
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete user');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users;

  return (
    <div className="admin-users admin-page">
      <header className="admin-page__hero">
        <div>
          <p className="admin-page__eyebrow">Team access</p>
          <h1>Manage accounts with care</h1>
          <p className="admin-page__lede">
            Invite the people who support our community, and match their access to the help they provide.
          </p>
        </div>
        <Link to="/help/crisis" className="btn btn-crisis">
          Get help now (24/7)
        </Link>
      </header>

      {error && (
        <div className="admin-page__alert" role="alert">
          <span className="admin-page__alert-label">We hit a snag:</span> {error}
        </div>
      )}

      <div className="admin-page__grid">
        <section className="admin-page__panel admin-users__panel--form">
          <header className="admin-page__panel-head">
            <div>
              <h2>{editingId ? 'Update account' : 'Create new user'}</h2>
              <p className="muted">
                {editingId
                  ? 'Adjust their details to keep access current.'
                  : 'Give someone access with a temporary password they can change after their first sign-in.'}
              </p>
            </div>
          </header>

          <form onSubmit={onSubmit} className="admin-page__form" noValidate>
            <div className="admin-page__field-grid">
              <label htmlFor="admin-user-username">
                <span>Username</span>
                <input
                  id="admin-user-username"
                  name="username"
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </label>
              <label htmlFor="admin-user-email">
                <span>Email</span>
                <input
                  id="admin-user-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="admin-page__field-grid">
              <label htmlFor="admin-user-firstname">
                <span>First name</span>
                <input
                  id="admin-user-firstname"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </label>
              <label htmlFor="admin-user-lastname">
                <span>Last name</span>
                <input
                  id="admin-user-lastname"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </label>
            </div>

            <label htmlFor="admin-user-role">
              <span>Role</span>
              <select
                id="admin-user-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                aria-describedby="admin-user-role-hint"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p id="admin-user-role-hint" className="admin-page__hint">
                Choose the lightest access that lets them do their job—you can adjust it anytime.
              </p>
            </label>

            {!editingId && (
              <label htmlFor="admin-user-password">
                <span>Temporary password</span>
                <input
                  id="admin-user-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password ?? ''}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  aria-describedby="admin-user-password-hint"
                />
                <p id="admin-user-password-hint" className="admin-page__hint">
                  Share it securely. They will create their own password after signing in.
                </p>
              </label>
            )}

            <div className="admin-page__actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update user' : 'Create user'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={startCreate}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-page__panel admin-users__panel--list">
          <header className="admin-page__panel-head">
            <div>
              <h2>All users</h2>
              <p className="muted">Search by name, email, or username. We load the latest 50 accounts.</p>
            </div>
            <form
              className="admin-page__search"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                fetchUsers();
              }}
            >
              <label htmlFor="admin-user-search" className="sr-only">Search users</label>
              <input
                id="admin-user-search"
                type="search"
                placeholder="Name, email, or username"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </form>
          </header>

          {loading ? (
            <p className="admin-page__empty">Loading...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <caption className="sr-only">Existing admin users and their access level</caption>
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
                    const roleLabel = ROLE_LABELS[user.profile.role] ?? user.profile.role;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-users__person">
                            <span className="admin-users__person-name">{displayName || user.username}</span>
                            <span className="admin-users__person-meta">{user.email}</span>
                            {displayName && (
                              <span className="admin-users__person-meta">@{user.username}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="admin-users__role-chip">{roleLabel}</span>
                        </td>
                        <td>
                          <span className={`admin-users__status ${user.is_active ? 'is-active' : 'is-disabled'}`}>
                            {user.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-page__table-actions">
                            <button
                              type="button"
                              className="admin-page__table-link"
                              onClick={() => startEdit(user)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-page__table-link admin-page__table-link--danger"
                              onClick={() => onDelete(user.id)}
                              disabled={!canManageAdmins && ['admin', 'super_admin', 'moderator'].includes(user.profile.role)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="admin-page__empty">
                        No users found. Try another name or role.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
