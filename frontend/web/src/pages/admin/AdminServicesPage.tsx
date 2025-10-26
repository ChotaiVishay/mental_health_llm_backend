import { FormEvent, useEffect, useState } from 'react';
import {
  createService,
  deleteService,
  listProviders,
  listServiceCategories,
  listServices,
  listServiceSubmissionRequests,
  deleteServiceSubmissionRequest,
  setServiceStatus,
  updateService,
} from '@/api/admin';
import { useAdminAuth } from '@/admin/AdminAuthContext';
import type { ProviderProfile, Service, ServiceCategory, ServiceSubmission } from '@/types/admin';

type ServiceForm = {
  name: string;
  summary?: string;
  description: string;
  provider_id?: string | null;
  category_id?: string | null;
  status: Service['status'];
  approval_notes?: string;
};

const DEFAULT_FORM: ServiceForm = {
  name: '',
  summary: '',
  description: '',
  provider_id: null,
  category_id: null,
  status: 'pending',
  approval_notes: '',
};

const STATUSES: Service['status'][] = ['draft', 'pending', 'approved', 'disabled', 'rejected'];

export default function AdminServicesPage() {
  const { admin } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [submissions, setSubmissions] = useState<ServiceSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ServiceSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Service['status'] | 'all'>('all');
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  const role = admin?.profile.role;
  const canApproveServices = role === 'moderator' || role === 'super_admin';
  const canModifyContent = role !== 'moderator';

  const loadLists = async () => {
    setLoading(true);
    try {
      const [svc, prov, cats, subs] = await Promise.all([
        listServices({ status: filter === 'all' ? undefined : filter, page_size: 50 }),
        listProviders({ status: 'approved', page_size: 100 }),
        listServiceCategories(),
        listServiceSubmissionRequests(),
      ]);
      setServices(svc.results);
      setProviders(prov.results);
      setCategories(cats);
      setSubmissions(subs);
      setSelectedSubmission((prev) => (prev ? subs.find((item) => item.id === prev.id) ?? null : null));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const resetForm = () => {
    setSelected(null);
    setSelectedSubmission(null);
    setForm({ ...DEFAULT_FORM });
  };

  const startEdit = (service: Service) => {
    setSelected(service);
    setSelectedSubmission(null);
    setForm({
      name: service.name,
      summary: service.summary ?? '',
      description: service.description,
      provider_id: service.provider?.id ?? null,
      category_id: service.category?.id ?? null,
      status: service.status,
      approval_notes: service.approval_notes ?? '',
    });
  };

  const selectSubmission = (submission: ServiceSubmission) => {
    const keyDetails: string[] = [
      `Organisation: ${submission.organisation_name}`,
      `Campus: ${submission.campus_name}`,
      `Address: ${submission.address}, ${submission.suburb}, ${submission.state} ${submission.postcode}`,
      `Region: ${submission.region_name}`,
      `Service types: ${submission.service_types.join(', ') || 'Not specified'}`,
      `Target populations: ${submission.target_populations.join(', ') || 'Not specified'}`,
      `Delivery method: ${submission.delivery_method}`,
      `Level of care: ${submission.level_of_care}`,
      `Referral pathway: ${submission.referral_pathway}`,
      `Cost: ${submission.cost}`,
    ];
    if (submission.expected_wait_time) keyDetails.push(`Expected wait time: ${submission.expected_wait_time}`);
    if (submission.phone) keyDetails.push(`Phone: ${submission.phone}`);
    if (submission.email) keyDetails.push(`Email: ${submission.email}`);
    if (submission.website) keyDetails.push(`Website: ${submission.website}`);
    if (submission.notes) keyDetails.push(`Notes: ${submission.notes}`);

    const openingNotes: string[] = [];
    if (submission.opening_hours_24_7) openingNotes.push('24/7');
    if (submission.opening_hours_standard) openingNotes.push('standard hours');
    if (submission.opening_hours_extended) {
      openingNotes.push(
        submission.op_hours_extended_details
          ? `extended hours (${submission.op_hours_extended_details})`
          : 'extended hours',
      );
    }
    if (openingNotes.length) keyDetails.push(`Opening hours: ${openingNotes.join(', ')}`);

    const summary = submission.notes?.slice(0, 150)
      || submission.service_types.join(', ')
      || `Service submission received ${new Date(submission.submitted_at).toLocaleDateString()}`;

    setSelected(null);
    setSelectedSubmission(submission);
    setForm({
      name: submission.service_name,
      summary,
      description: keyDetails.join('\n'),
      provider_id: null,
      category_id: null,
      status: 'pending',
      approval_notes: '',
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const submissionContext = selectedSubmission;
    if (submissionContext && !canApproveServices) {
      setError('Only moderators can publish submissions into the directory.');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        name: form.name,
        summary: form.summary,
        description: form.description,
        status: form.status,
        approval_notes: form.approval_notes,
        provider_id: form.provider_id,
        category_id: form.category_id,
      };
      if (!canApproveServices && payload.status === 'approved') {
        setError('Only moderators can approve services.');
        setSaving(false);
        return;
      }

      if (selected) {
        await updateService(selected.id, payload);
      } else {
        await createService(payload);
        if (submissionContext) {
          await deleteServiceSubmissionRequest(submissionContext.id);
        }
      }
      await loadLists();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const removeSubmission = async (submission: ServiceSubmission) => {
    if (!canApproveServices) {
      setError('Only moderators can remove submissions from the queue.');
      return;
    }
    if (!window.confirm('Remove this submission from the review queue?')) return;
    setSaving(true);
    try {
      await deleteServiceSubmissionRequest(submission.id);
      await loadLists();
      if (selectedSubmission?.id === submission.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove submission');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (service: Service, status: Service['status']) => {
    if (!canApproveServices && status === 'approved') {
      setError('Only moderators can approve services.');
      return;
    }
    setSaving(true);
    try {
      await setServiceStatus(service.id, status, form.approval_notes);
      await loadLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service status');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (service: Service) => {
    if (!window.confirm('Delete this service?')) return;
    setSaving(true);
    try {
      await deleteService(service.id);
      await loadLists();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-services">
      <header className="admin-section-head">
        <div>
          <h1>Service management</h1>
          <p className="muted">Approve and curate the services directory.</p>
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

      <section className="service-submissions">
        <h2>Pending service submissions</h2>
        {loading ? (
          <p>Loading…</p>
        ) : submissions.length ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Organisation</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className={selectedSubmission?.id === submission.id ? 'is-active' : undefined}>
                    <td>{submission.service_name}</td>
                    <td>{submission.organisation_name}</td>
                    <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => selectSubmission(submission)} disabled={saving}>
                          Review
                        </button>
                        <button type="button" onClick={() => removeSubmission(submission)} disabled={saving}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No submissions awaiting review.</p>
        )}
      </section>

      <section className="service-form">
        <h2>{selected ? 'Edit service' : 'Create service'}</h2>
        {selectedSubmission && (
          <div className="alert info">
            <p>
              Prefilling from submission <strong>{selectedSubmission.service_name}</strong>.
              Review the generated details and save to create a catalogue entry.
            </p>
            <button type="button" className="btn -ghost" onClick={() => setSelectedSubmission(null)}>
              Clear submission context
            </button>
          </div>
        )}
        <form className="stack" onSubmit={submit}>
          <label>
            <span>Service name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            <span>Summary</span>
            <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              required
            />
          </label>
          <div className="form-row">
            <label>
              <span>Provider</span>
              <select
                value={form.provider_id ?? ''}
                onChange={(e) => setForm({ ...form, provider_id: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.display_name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Category</span>
              <select
                value={form.category_id ?? ''}
                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) => {
                  const next = e.target.value as Service['status'];
                  if (
                    admin?.profile.role === 'moderator'
                    && !['pending', 'approved', 'disabled', 'rejected'].includes(next)
                  ) {
                    return;
                  }
                  setForm({ ...form, status: next });
                }}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Approval notes</span>
              <input
                value={form.approval_notes ?? ''}
                onChange={(e) => setForm({ ...form, approval_notes: e.target.value })}
              />
            </label>
          </div>

          <div className="actions">
            <button type="submit" className="btn" disabled={saving || (!canModifyContent && !selected)}>
              {saving ? 'Saving…' : selected ? 'Update service' : 'Create service'}
            </button>
            {selected && (
              <button type="button" className="btn -ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
            {selected && canModifyContent && (
              <button type="button" className="btn -ghost" onClick={() => remove(selected)}>
                Delete
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>Services</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{service.provider?.display_name ?? '—'}</td>
                    <td>{service.status}</td>
                    <td>{new Date(service.updated_at).toLocaleString()}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => startEdit(service)}>Edit</button>
                        {admin?.profile.role !== 'moderator' && (
                          <button type="button" onClick={() => remove(service)}>Delete</button>
                        )}
                        <button type="button" onClick={() => changeStatus(service, 'approved')}>Approve</button>
                        <button type="button" onClick={() => changeStatus(service, 'disabled')}>Disable</button>
                        <button type="button" onClick={() => changeStatus(service, 'rejected')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>No services found.</td>
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
