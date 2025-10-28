import { ChangeEvent, FormEvent, useState } from 'react';
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

  const handleChange =
    (field: keyof typeof form) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
      };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      setMessage('Profile updated successfully.');
    } else {
      setError(result.error ?? 'Failed to update profile.');
    }
  };

  return (
    <div className="admin-profile admin-page">
      <header className="admin-page__hero">
        <div>
          <p className="admin-page__eyebrow">Account settings</p>
          <h1>My profile</h1>
          <p className="admin-page__lede">Update your contact information and preferences.</p>
        </div>
      </header>

      {error && (
        <div className="admin-page__alert" role="alert">
          <span className="admin-page__alert-label">We hit a snag:</span> {error}
        </div>
      )}
      {message && <p className="success" role="status">{message}</p>}

      <section className="admin-page__panel admin-profile__panel">
        <header className="admin-page__panel-head">
          <div>
            <h2>Contact details</h2>
            <p className="muted">Let us know how to reach you if we need to confirm updates.</p>
          </div>
        </header>

        <form className="admin-page__form admin-profile__form" onSubmit={onSubmit} noValidate>
          <div className="admin-page__field-grid admin-profile__field-grid">
            <label htmlFor="admin-profile-first-name">
              <span>First name</span>
              <input
                id="admin-profile-first-name"
                name="first_name"
                autoComplete="given-name"
                value={form.first_name}
                onChange={handleChange('first_name')}
              />
            </label>
            <label htmlFor="admin-profile-last-name">
              <span>Last name</span>
              <input
                id="admin-profile-last-name"
                name="last_name"
                autoComplete="family-name"
                value={form.last_name}
                onChange={handleChange('last_name')}
              />
            </label>
          </div>

          <div className="admin-page__field-grid admin-profile__field-grid">
            <label htmlFor="admin-profile-phone">
              <span>Phone</span>
              <input
                id="admin-profile-phone"
                name="phone_number"
                autoComplete="tel"
                value={form.phone_number}
                onChange={handleChange('phone_number')}
              />
            </label>
            <label htmlFor="admin-profile-organisation">
              <span>Organisation</span>
              <input
                id="admin-profile-organisation"
                name="organisation"
                value={form.organisation}
                onChange={handleChange('organisation')}
              />
            </label>
            <label htmlFor="admin-profile-job-title">
              <span>Job title</span>
              <input
                id="admin-profile-job-title"
                name="job_title"
                value={form.job_title}
                onChange={handleChange('job_title')}
              />
            </label>
          </div>

          <label htmlFor="admin-profile-notes" className="admin-profile__notes">
            <span>Notes</span>
            <textarea
              id="admin-profile-notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={handleChange('notes')}
            />
          </label>

          <div className="admin-page__actions admin-profile__actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
