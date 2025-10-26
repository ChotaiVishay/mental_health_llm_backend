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
      <section>
        <h1>Administrator access</h1>
        <p className="muted">Only super administrators may manage admin accounts.</p>
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
    <div className="admin-admins">
      <h1>Manage administrators</h1>
      <p className="muted">Create or revoke administrative access.</p>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="admin-form">
        <h2>{editingId ? 'Update administrator' : 'Invite administrator'}</h2>
        <form className="stack" onSubmit={submit}>
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
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </label>
          {!editingId && (
            <label>
              <span>Temporary password</span>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </label>
          )}
          <div className="actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create admin'}
            </button>
            {editingId && (
              <button type="button" className="btn -ghost" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>Administrators</h2>
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
                  <th>Last login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.profile.role}</td>
                    <td>{user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => startEdit(user)}>Edit</button>
                        {admin?.id !== user.id && (
                          <button type="button" onClick={() => remove(user.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>No admin accounts yet.</td>
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
