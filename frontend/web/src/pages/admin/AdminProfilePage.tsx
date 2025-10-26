import { FormEvent, useState } from 'react';
import { useAdminAuth } from '@/admin/AdminAuthContext';

export default function AdminProfilePage() {
  const { admin, updateProfile, loading } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: admin?.first_name ?? '',
    last_name: admin?.last_name ?? '',
    phone_number: admin?.profile.phone_number ?? '',
    organisation: admin?.profile.organisation ?? '',
    job_title: admin?.profile.job_title ?? '',
    notes: admin?.profile.notes ?? '',
  });

  if (!admin) return null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const result = await updateProfile({
      first_name: form.first_name,
      last_name: form.last_name,
      profile: {
        phone_number: form.phone_number,
        organisation: form.organisation,
        job_title: form.job_title,
        notes: form.notes,
      },
    });
    if (result.ok) {
      setMessage('Profile updated successfully');
    } else {
      setError(result.error ?? 'Failed to update profile');
    }
  };

  return (
    <section className="admin-profile">
      <h1>My profile</h1>
      <p className="muted">Update your contact information and preferences.</p>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success" role="status">{message}</p>}

      <form className="stack" onSubmit={onSubmit}>
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
          <span>Phone</span>
          <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        </label>
        <label>
          <span>Organisation</span>
          <input value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
        </label>
        <label>
          <span>Job title</span>
          <input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
        </label>
        <label>
          <span>Notes</span>
          <textarea value={form.notes} rows={4} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>

        <button type="submit" className="btn" disabled={loading}>Save changes</button>
      </form>
    </section>
  );
}
