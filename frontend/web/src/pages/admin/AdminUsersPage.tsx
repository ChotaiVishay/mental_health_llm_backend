import { FormEvent, useEffect, useMemo, useState } from 'react';
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
    <div className="admin-users">
      <header className="admin-section-head">
        <div>
          <h1>Manage users</h1>
          <p className="muted">Create, update, or remove user accounts.</p>
        </div>
        <div className="search">
          <label>
            <span className="sr-only">Search users</span>
            <input
              type="search"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={fetchUsers}
            />
          </label>
          <button type="button" className="btn" onClick={fetchUsers}>Search</button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="admin-form">
        <h2>{editingId ? 'Edit user' : 'Create new user'}</h2>
        <form onSubmit={onSubmit} className="stack">
          <div className="form-row">
            <label>
              <span>Username</span>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>First name</span>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </label>
            <label>
              <span>Last name</span>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </label>
          </div>

          <label>
            <span>Role</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {!editingId && (
            <label>
              <span>Temporary password</span>
              <input
                type="password"
                value={form.password ?? ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
          )}

          <div className="actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update user' : 'Create user'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn -ghost"
                onClick={startCreate}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>All users</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.profile.role}</td>
                    <td>{user.is_active ? 'Active' : 'Disabled'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => startEdit(user)}>Edit</button>
                        <button
                          type="button"
                          onClick={() => onDelete(user.id)}
                          disabled={!canManageAdmins && ['admin', 'super_admin', 'moderator'].includes(user.profile.role)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
