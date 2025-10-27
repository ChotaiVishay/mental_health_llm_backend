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

const STATUS_LABELS: Record<Service['status'], string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  disabled: 'Disabled',
  rejected: 'Rejected',
};

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

  const submissionCountLabel = submissions.length === 1 ? '1 waiting' : `${submissions.length} waiting`;

  return (
    <div className="admin-services admin-page">
      <header className="admin-page__hero">
        <div>
          <p className="admin-page__eyebrow">Service directory</p>
          <h1>Guide support listings with confidence</h1>
          <p className="admin-page__lede">
            Review community submissions and keep information accurate for people looking for help.
          </p>
        </div>
        <div className="admin-services__filters">
          <label htmlFor="admin-service-status-filter">Status filter</label>
          <select
            id="admin-service-status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="admin-page__alert" role="alert">
          <span className="admin-page__alert-label">We hit a snag:</span> {error}
        </div>
      )}

      <div className="admin-page__grid admin-services__grid">
        <section className="admin-page__panel admin-services__panel admin-services__panel--queue">
          <header className="admin-page__panel-head">
            <div>
              <h2>Submission queue</h2>
              <p className="muted">Load a submission to prefill the form, then save it to publish.</p>
            </div>
            <span className="admin-services__count">{submissionCountLabel}</span>
          </header>

          {loading ? (
            <p className="admin-page__empty">Loading submissions...</p>
          ) : submissions.length ? (
            <div className="table-wrapper">
              <table>
                <caption className="sr-only">Service submissions awaiting review</caption>
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Organisation</th>
                    <th scope="col">Submitted</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className={selectedSubmission?.id === submission.id ? 'is-active' : undefined}
                    >
                      <td>{submission.service_name}</td>
                      <td>{submission.organisation_name}</td>
                      <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                      <td>
                        <div className="admin-page__table-actions">
                          <button
                            type="button"
                            className="admin-page__table-link"
                            onClick={() => selectSubmission(submission)}
                            disabled={saving}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="admin-page__table-link admin-page__table-link--danger"
                            onClick={() => removeSubmission(submission)}
                            disabled={saving || !canApproveServices}
                          >
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
            <p className="admin-page__empty">No submissions waiting right now.</p>
          )}
        </section>

        <section className="admin-page__panel admin-services__panel admin-services__panel--form">
          <header className="admin-page__panel-head">
            <div>
              <h2>{selected ? 'Edit service' : 'Create service'}</h2>
              <p className="muted">
                {selected
                  ? 'Update the details that surface for people browsing support options.'
                  : 'Capture the essentials so people understand who the service supports and how to reach them.'}
              </p>
            </div>
          </header>

          {selectedSubmission && (
            <div className="admin-callout admin-callout--info">
              <p>
                Prefilling from <strong>{selectedSubmission.service_name}</strong> by {selectedSubmission.organisation_name}.
                Review the details and save to add it to the directory.
              </p>
              <button type="button" className="btn btn-link" onClick={() => setSelectedSubmission(null)}>
                Clear submission context
              </button>
            </div>
          )}

          <form className="admin-page__form" onSubmit={submit} noValidate>
            <label htmlFor="admin-service-name">
              <span>Service name</span>
              <input
                id="admin-service-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label htmlFor="admin-service-summary">
              <span>Summary</span>
              <input
                id="admin-service-summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </label>
            <label htmlFor="admin-service-description">
              <span>Description</span>
              <textarea
                id="admin-service-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                required
              />
            </label>

            <div className="admin-page__field-grid">
              <label htmlFor="admin-service-provider">
                <span>Provider</span>
                <select
                  id="admin-service-provider"
                  value={form.provider_id ?? ''}
                  onChange={(e) => setForm({ ...form, provider_id: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.display_name}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="admin-service-category">
                <span>Category</span>
                <select
                  id="admin-service-category"
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

            <div className="admin-page__field-grid">
              <label htmlFor="admin-service-status">
                <span>Status</span>
                <select
                  id="admin-service-status"
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
                    <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="admin-service-notes">
                <span>Approval notes</span>
                <input
                  id="admin-service-notes"
                  value={form.approval_notes ?? ''}
                  onChange={(e) => setForm({ ...form, approval_notes: e.target.value })}
                />
              </label>
            </div>

            <div className="admin-page__actions">
              <button type="submit" className="btn btn-primary" disabled={saving || (!canModifyContent && !selected)}>
                {saving ? 'Saving...' : selected ? 'Update service' : 'Create service'}
              </button>
              {selected && (
                <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                  Cancel
                </button>
              )}
              {selected && canModifyContent && (
                <button
                  type="button"
                  className="btn btn-link admin-services__danger-link"
                  onClick={() => remove(selected)}
                  disabled={saving}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      <section className="admin-page__panel admin-services__panel admin-services__panel--list">
        <header className="admin-page__panel-head">
          <div>
            <h2>Services</h2>
            <p className="muted">We show the latest 50 entries for quick edits.</p>
          </div>
        </header>

        {loading ? (
          <p className="admin-page__empty">Loading services...</p>
        ) : services.length ? (
          <div className="table-wrapper">
            <table>
              <caption className="sr-only">Managed services and their current status</caption>
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="admin-services__service">
                        <span className="admin-services__service-name">{service.name}</span>
                        {service.summary && (
                          <span className="admin-services__service-summary">{service.summary}</span>
                        )}
                      </div>
                    </td>
                    <td>{service.provider?.display_name ?? 'Unassigned'}</td>
                    <td>
                      <span className={`admin-services__status is-${service.status}`}>
                        {STATUS_LABELS[service.status]}
                      </span>
                    </td>
                    <td>
                      <span className="admin-services__meta">
                        {new Date(service.updated_at).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="admin-page__table-actions admin-services__actions">
                        <button
                          type="button"
                          className="admin-page__table-link"
                          onClick={() => startEdit(service)}
                        >
                          Edit
                        </button>
                        {canModifyContent && (
                          <button
                            type="button"
                            className="admin-page__table-link admin-page__table-link--danger"
                            onClick={() => remove(service)}
                          >
                            Delete
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-page__table-link"
                          onClick={() => changeStatus(service, 'approved')}
                          disabled={!canApproveServices}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-page__table-link"
                          onClick={() => changeStatus(service, 'disabled')}
                          disabled={!canApproveServices}
                        >
                          Disable
                        </button>
                        <button
                          type="button"
                          className="admin-page__table-link admin-page__table-link--danger"
                          onClick={() => changeStatus(service, 'rejected')}
                          disabled={!canApproveServices}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-page__empty">No services match this status yet.</p>
        )}
      </section>
    </div>
  );
}
