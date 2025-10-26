import { useEffect, useMemo, useState, type FormEvent } from 'react';

export type ServiceFormField = {
  id: string;
  label: string;
  required?: boolean;
  control?: 'text' | 'textarea' | 'select' | 'checkbox' | 'multiselect';
  helper?: string;
  optionsKey?: string;
};

export type ServiceFormAction = {
  type: 'collect_service_details';
  fields: ServiceFormField[];
  option_sets?: Record<string, string[]>;
};

type ServiceFormModalProps = {
  open: boolean;
  action: ServiceFormAction | null;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
};

type FieldErrors = Record<string, string>;

function initialValues(fields: ServiceFormField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  fields.forEach((field) => {
    switch (field.control) {
      case 'checkbox':
        values[field.id] = false;
        break;
      case 'multiselect':
        values[field.id] = [];
        break;
      default:
        values[field.id] = '';
    }
  });
  return values;
}

export default function ServiceFormModal({
  open,
  action,
  submitting,
  error,
  onClose,
  onSubmit,
}: ServiceFormModalProps) {
  const fields = useMemo(() => action?.fields ?? [], [action]);
  const optionSets = useMemo(() => action?.option_sets ?? {}, [action]);
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(fields));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [expandedField, setExpandedField] = useState<string | null>(null);

  useEffect(() => {
    if (open && fields.length) {
      setValues(initialValues(fields));
      setFieldErrors({});
      setExpandedField(null);
    }
  }, [open, fields]);

  const requiredFieldLabels = useMemo(
    () => fields.filter((field) => field.required).map((field) => field.label),
    [fields],
  );

  if (!open || !action) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExpandedField(null);

    const errors: FieldErrors = {};
    fields.forEach((field) => {
      if (!field.required) return;
      const value = values[field.id];
      const isEmpty =
        field.control === 'checkbox'
          ? false
          : field.control === 'multiselect'
            ? !Array.isArray(value) || value.length === 0
            : value === undefined ||
              value === null ||
              (typeof value === 'string' && !value.trim().length);
      if (isEmpty) {
        errors[field.id] = `${field.label} is required.`;
      }
    });
    setFieldErrors(errors);

    if (Object.keys(errors).length) return;

    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const raw = values[field.id];
      switch (field.control) {
        case 'checkbox':
          payload[field.id] = Boolean(raw);
          break;
        case 'multiselect':
          payload[field.id] = Array.isArray(raw) ? raw : [];
          break;
        default: {
          const trimmed = typeof raw === 'string' ? raw.trim() : raw;
          payload[field.id] = trimmed ?? null;
          break;
        }
      }
    });

    onSubmit(payload);
  };

  return (
    <div className="chat-service-form-backdrop" role="presentation">
      <div
        className="chat-service-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-service-form-title"
      >
        <header className="chat-service-form-head">
          <div>
            <h2 id="chat-service-form-title">Add a mental health service</h2>
            <p className="muted">
              Required fields: {requiredFieldLabels.join(', ')}.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close service form"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </header>

        <form className="chat-service-form-body" onSubmit={handleSubmit}>
          <div className="chat-service-form-grid">
            {fields.map((field) => {
              const control = field.control ?? 'text';
              const fieldId = `service-form-${field.id}`;
              const value = values[field.id];
              const options = (field.optionsKey && optionSets[field.optionsKey]) || optionSets[field.id];

              return (
                <div key={field.id} className="chat-service-form-field">
                  <label htmlFor={fieldId}>
                    {field.label}
                    {field.required ? <span className="required">*</span> : null}
                  </label>

                  {control === 'textarea' && (
                    <textarea
                      id={fieldId}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
                      }
                      disabled={submitting}
                      rows={3}
                    />
                  )}

                  {control === 'select' && (
                    <select
                      id={fieldId}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
                      }
                      disabled={submitting}
                    >
                      <option value="">Select...</option>
                      {(options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {control === 'multiselect' && (
                    <div className="chat-service-form-multiselect">
                      <button
                        type="button"
                        className="multiselect-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={expandedField === field.id}
                        onClick={() => setExpandedField((prev) => (prev === field.id ? null : field.id))}
                        disabled={submitting}
                      >
                        {Array.isArray(value) && value.length ? value.join(', ') : 'Select...'}
                      </button>
                      {expandedField === field.id && (
                        <div className="multiselect-menu" role="listbox">
                          {(options ?? []).map((option) => {
                            const checked = Array.isArray(value) ? value.includes(option) : false;
                            return (
                              <label key={option} className="multiselect-option">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    const selected = Array.isArray(value) ? [...value] : [];
                                    if (event.target.checked) {
                                      if (!selected.includes(option)) selected.push(option);
                                    } else {
                                      const idx = selected.indexOf(option);
                                      if (idx >= 0) selected.splice(idx, 1);
                                    }
                                    setValues((prev) => ({ ...prev, [field.id]: selected }));
                                  }}
                                  disabled={submitting}
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                          <button
                            type="button"
                            className="multiselect-close"
                            onClick={() => setExpandedField(null)}
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {control === 'checkbox' && (
                    <label className="chat-service-form-checkbox">
                      <input
                        id={fieldId}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          setValues((prev) => ({ ...prev, [field.id]: event.target.checked }))
                        }
                        disabled={submitting}
                      />
                      <span>Yes</span>
                    </label>
                  )}

                  {control === 'text' && (
                    <input
                      id={fieldId}
                      type="text"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
                      }
                      disabled={submitting}
                    />
                  )}

                  {field.helper && <p className="chat-service-form-helper">{field.helper}</p>}
                  {fieldErrors[field.id] && (
                    <p className="chat-service-form-error" role="alert">
                      {fieldErrors[field.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="chat-service-form-server-error" role="alert">
              {error}
            </div>
          )}

          <div className="chat-service-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
