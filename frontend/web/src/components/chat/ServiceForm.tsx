import { useMemo, useState } from 'react';
import type { ServiceFormPayload } from '@/api/chat';

export const DELIVERY_METHODS = ['In person', 'Online', 'Outreach', 'Both'] as const;
export const LEVELS_OF_CARE = ['Self management', 'Low intensity', 'Moderate intensity', 'High intensity', 'Specialist'] as const;
export const WORKFORCE_OPTIONS = [
  { value: 'Medical', label: 'Medical' },
  { value: 'Peer worker ', label: 'Peer worker' },
  { value: 'Tertiary qualified', label: 'Tertiary qualified' },
  { value: 'Vocationally qualified', label: 'Vocationally qualified' },
] as const;
export const REFERRAL_PATHWAYS = ['Doctor/GP referral', 'Free call', 'General bookings', 'Varies depending on service'] as const;
export const COST_OPTIONS = ['Free', 'Paid', 'N/A'] as const;

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'] as const;
const SERVICE_TYPE_OPTIONS = [
  'Primary and specialised clinical ambulatory mental health care services',
  'Community mental health support',
  'Acute inpatient mental health care',
  'Suicide prevention and crisis support',
  'Counselling and psychological services',
  'Peer-led programs',
  'Other',
] as const;
const TARGET_POPULATION_OPTIONS = [
  'Children',
  'Young People',
  'Adult',
  'Older Adults',
  'Aboriginal and Torres Strait Islander people',
  'LGBTQIA+ community',
  'Culturally and Linguistically Diverse people',
  'Carers and families',
  'Other',
] as const;

export type ServiceFormValues = {
  serviceName: string;
  organisationName: string;
  campusName: string;
  regionName: string;
  serviceType: string[];
  deliveryMethod: string;
  levelOfCare: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone?: string;
  email?: string;
  website?: string;
  referralPathway: string;
  cost: string;
  targetPopulation: string[];
  workforceType: string;
  notes?: string;
  waitTime?: string;
  openingHours24_7: boolean;
  openingHoursStandard: boolean;
  openingHoursExtended: boolean;
  opHoursExtendedDetails?: string;
};

type InternalFormState = {
  serviceName: string;
  organisationName: string;
  campusName: string;
  regionName: string;
  serviceTypeSelections: string[];
  additionalServiceTypes: string;
  deliveryMethod: string;
  levelOfCare: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  referralPathway: string;
  cost: string;
  targetPopulationSelections: string[];
  additionalTargetPopulations: string;
  workforceType: string;
  notes: string;
  waitTime: string;
  openingHours24_7: boolean;
  openingHoursStandard: boolean;
  openingHoursExtended: boolean;
  opHoursExtendedDetails: string;
};

const INITIAL_STATE: InternalFormState = {
  serviceName: '',
  organisationName: '',
  campusName: '',
  regionName: '',
  serviceTypeSelections: [],
  additionalServiceTypes: '',
  deliveryMethod: '',
  levelOfCare: '',
  address: '',
  suburb: '',
  state: 'VIC',
  postcode: '',
  phone: '',
  email: '',
  website: '',
  referralPathway: '',
  cost: '',
  targetPopulationSelections: [],
  additionalTargetPopulations: '',
  workforceType: '',
  notes: '',
  waitTime: '',
  openingHours24_7: false,
  openingHoursStandard: true,
  openingHoursExtended: false,
  opHoursExtendedDetails: '',
};

type ErrorMap = Partial<Record<keyof InternalFormState, string>>;

type Props = {
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

function sanitizeList(input: string[]): string[] {
  return Array.from(
    new Set(
      input
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function parseAdditional(input: string): string[] {
  return sanitizeList(
    input
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function toPayloadData(state: InternalFormState): ServiceFormValues {
  const serviceType = sanitizeList([...state.serviceTypeSelections, ...parseAdditional(state.additionalServiceTypes)]);
  const targetPopulation = sanitizeList([
    ...state.targetPopulationSelections,
    ...parseAdditional(state.additionalTargetPopulations),
  ]);

  return {
    serviceName: state.serviceName.trim(),
    organisationName: state.organisationName.trim(),
    campusName: state.campusName.trim(),
    regionName: state.regionName.trim(),
    serviceType,
    deliveryMethod: state.deliveryMethod,
    levelOfCare: state.levelOfCare,
    address: state.address.trim(),
    suburb: state.suburb.trim(),
    state: state.state,
    postcode: state.postcode.trim(),
    phone: state.phone.trim() || undefined,
    email: state.email.trim() || undefined,
    website: state.website.trim() || undefined,
    referralPathway: state.referralPathway,
    cost: state.cost,
    targetPopulation,
    workforceType: state.workforceType,
    notes: state.notes.trim() || undefined,
    waitTime: state.waitTime.trim() || undefined,
    openingHours24_7: state.openingHours24_7,
    openingHoursStandard: state.openingHoursStandard,
    openingHoursExtended: state.openingHoursExtended,
    opHoursExtendedDetails: state.opHoursExtendedDetails.trim() || undefined,
  };
}

function validate(state: InternalFormState): ErrorMap {
  const errors: ErrorMap = {};
  const payload = toPayloadData(state);

  const requiredText: Array<[keyof InternalFormState, string]> = [
    ['serviceName', 'Service name is required'],
    ['organisationName', 'Organisation name is required'],
    ['campusName', 'Campus name is required'],
    ['regionName', 'Region name is required'],
    ['address', 'Address is required'],
    ['suburb', 'Suburb is required'],
    ['postcode', 'Postcode is required'],
  ];

  for (const [key, message] of requiredText) {
    if (!state[key].toString().trim()) errors[key] = message;
  }

  if (!payload.serviceType.length) errors.serviceTypeSelections = 'Select at least one service type or add your own.';
  if (!payload.targetPopulation.length) {
    errors.targetPopulationSelections = 'Select at least one target population or add your own.';
  }

  if (!payload.deliveryMethod) errors.deliveryMethod = 'Choose a delivery method.';
  if (!payload.levelOfCare) errors.levelOfCare = 'Choose a level of care.';
  if (!payload.referralPathway) errors.referralPathway = 'Select a referral pathway.';
  if (!payload.cost) errors.cost = 'Select how the service is funded.';
  if (!payload.workforceType) errors.workforceType = 'Choose a workforce type.';

  if (payload.postcode && !/^\d{3,4}$/.test(payload.postcode)) {
    errors.postcode = 'Postcode must be 3–4 digits.';
  }

  if (payload.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(payload.email)) errors.email = 'Enter a valid email.';
  }

  if (payload.website) {
    try {
      new URL(payload.website);
    } catch {
      errors.website = 'Enter a valid URL (include https://).';
    }
  }

  if (payload.openingHoursExtended && !payload.opHoursExtendedDetails) {
    errors.opHoursExtendedDetails = 'Provide details for extended hours.';
  }

  return errors;
}

export default function ServiceForm({ onSubmit, onCancel, submitting }: Props) {
  const [state, setState] = useState<InternalFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const disableSubmit = submitting ?? false;

  const handleChange = <K extends keyof InternalFormState>(key: K, value: InternalFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInList = (key: 'serviceTypeSelections' | 'targetPopulationSelections', value: string) => {
    setState((prev) => {
      const hasValue = prev[key].includes(value);
      const next = hasValue ? prev[key].filter((item) => item !== value) : [...prev[key], value];
      return { ...prev, [key]: next };
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSubmitError(null);
      await onSubmit(toPayloadData(state));
      setState(INITIAL_STATE);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setSubmitError(message);
    }
  }

  const serviceTypeHelper = useMemo(() => {
    if (!errors.serviceTypeSelections) return null;
    return errors.serviceTypeSelections;
  }, [errors.serviceTypeSelections]);

  const targetPopulationHelper = useMemo(() => {
    if (!errors.targetPopulationSelections) return null;
    return errors.targetPopulationSelections;
  }, [errors.targetPopulationSelections]);

  return (
    <form className="service-form" onSubmit={handleSubmit} aria-label="Add a new service">
      <header className="service-form__header">
        <div>
          <h3 className="h3" style={{ margin: 0 }}>Submit a service</h3>
          <p className="muted small" style={{ marginTop: 4, marginBottom: 0 }}>
            We'll review your submission before listing it publicly.
          </p>
        </div>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </header>

      {submitError && (
        <div className="service-form__alert" role="alert">
          {submitError}
        </div>
      )}

      <section className="service-form__section">
        <h4 className="service-form__section-title">Service details</h4>
        <div className="service-form__grid">
          <label className="service-form__field">
            <span>Service name *</span>
            <input
              value={state.serviceName}
              onChange={(e) => handleChange('serviceName', e.target.value)}
              required
            />
            {errors.serviceName && <span className="service-form__error">{errors.serviceName}</span>}
          </label>
          <label className="service-form__field">
            <span>Organisation *</span>
            <input
              value={state.organisationName}
              onChange={(e) => handleChange('organisationName', e.target.value)}
              required
            />
            {errors.organisationName && <span className="service-form__error">{errors.organisationName}</span>}
          </label>
          <label className="service-form__field">
            <span>Campus or site *</span>
            <input
              value={state.campusName}
              onChange={(e) => handleChange('campusName', e.target.value)}
              required
            />
            {errors.campusName && <span className="service-form__error">{errors.campusName}</span>}
          </label>
          <label className="service-form__field">
            <span>Region *</span>
            <input
              value={state.regionName}
              onChange={(e) => handleChange('regionName', e.target.value)}
              required
            />
            {errors.regionName && <span className="service-form__error">{errors.regionName}</span>}
          </label>
        </div>
      </section>

      <section className="service-form__section">
        <h4 className="service-form__section-title">How the service operates</h4>
        <div className="service-form__grid">
          <label className="service-form__field">
            <span>Service types *</span>
            <div className="service-form__checkboxes" role="group" aria-label="Service type">
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <label key={option} className="service-form__checkbox">
                  <input
                    type="checkbox"
                    checked={state.serviceTypeSelections.includes(option)}
                    onChange={() => toggleInList('serviceTypeSelections', option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <textarea
              placeholder="Add any other service types (comma or line separated)"
              value={state.additionalServiceTypes}
              onChange={(e) => handleChange('additionalServiceTypes', e.target.value)}
              rows={2}
            />
            {serviceTypeHelper && <span className="service-form__error">{serviceTypeHelper}</span>}
          </label>

          <label className="service-form__field">
            <span>Delivery method *</span>
            <select value={state.deliveryMethod} onChange={(e) => handleChange('deliveryMethod', e.target.value)}>
              <option value="" disabled>Select one</option>
              {DELIVERY_METHODS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.deliveryMethod && <span className="service-form__error">{errors.deliveryMethod}</span>}
          </label>

          <label className="service-form__field">
            <span>Level of care *</span>
            <select value={state.levelOfCare} onChange={(e) => handleChange('levelOfCare', e.target.value)}>
              <option value="" disabled>Select one</option>
              {LEVELS_OF_CARE.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.levelOfCare && <span className="service-form__error">{errors.levelOfCare}</span>}
          </label>

          <label className="service-form__field">
            <span>Workforce type *</span>
            <select value={state.workforceType} onChange={(e) => handleChange('workforceType', e.target.value)}>
              <option value="" disabled>Select one</option>
              {WORKFORCE_OPTIONS.map((option) => (
                <option key={option.value.trim()} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.workforceType && <span className="service-form__error">{errors.workforceType}</span>}
          </label>

          <label className="service-form__field">
            <span>Referral pathway *</span>
            <select value={state.referralPathway} onChange={(e) => handleChange('referralPathway', e.target.value)}>
              <option value="" disabled>Select one</option>
              {REFERRAL_PATHWAYS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.referralPathway && <span className="service-form__error">{errors.referralPathway}</span>}
          </label>

          <label className="service-form__field">
            <span>Cost *</span>
            <select value={state.cost} onChange={(e) => handleChange('cost', e.target.value)}>
              <option value="" disabled>Select one</option>
              {COST_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.cost && <span className="service-form__error">{errors.cost}</span>}
          </label>
        </div>
      </section>

      <section className="service-form__section">
        <h4 className="service-form__section-title">Who the service supports</h4>
        <div className="service-form__grid">
          <label className="service-form__field">
            <span>Target population *</span>
            <div className="service-form__checkboxes" role="group" aria-label="Target population">
              {TARGET_POPULATION_OPTIONS.map((option) => (
                <label key={option} className="service-form__checkbox">
                  <input
                    type="checkbox"
                    checked={state.targetPopulationSelections.includes(option)}
                    onChange={() => toggleInList('targetPopulationSelections', option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <textarea
              placeholder="Add any other populations (comma or line separated)"
              value={state.additionalTargetPopulations}
              onChange={(e) => handleChange('additionalTargetPopulations', e.target.value)}
              rows={2}
            />
            {targetPopulationHelper && <span className="service-form__error">{targetPopulationHelper}</span>}
          </label>
        </div>
      </section>

      <section className="service-form__section">
        <h4 className="service-form__section-title">Contact and location</h4>
        <div className="service-form__grid">
          <label className="service-form__field">
            <span>Street address *</span>
            <input
              value={state.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
            {errors.address && <span className="service-form__error">{errors.address}</span>}
          </label>
          <label className="service-form__field">
            <span>Suburb *</span>
            <input
              value={state.suburb}
              onChange={(e) => handleChange('suburb', e.target.value)}
              required
            />
            {errors.suburb && <span className="service-form__error">{errors.suburb}</span>}
          </label>
          <label className="service-form__field">
            <span>State *</span>
            <select value={state.state} onChange={(e) => handleChange('state', e.target.value)}>
              {STATES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="service-form__field">
            <span>Postcode *</span>
            <input
              value={state.postcode}
              onChange={(e) => handleChange('postcode', e.target.value)}
              inputMode="numeric"
              required
            />
            {errors.postcode && <span className="service-form__error">{errors.postcode}</span>}
          </label>
          <label className="service-form__field">
            <span>Phone</span>
            <input
              value={state.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="e.g. 03 9000 0000"
            />
          </label>
          <label className="service-form__field">
            <span>Email</span>
            <input
              value={state.email}
              onChange={(e) => handleChange('email', e.target.value)}
              type="email"
              placeholder="contact@example.com"
            />
            {errors.email && <span className="service-form__error">{errors.email}</span>}
          </label>
          <label className="service-form__field">
            <span>Website</span>
            <input
              value={state.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://"
            />
            {errors.website && <span className="service-form__error">{errors.website}</span>}
          </label>
        </div>
      </section>

      <section className="service-form__section">
        <h4 className="service-form__section-title">Availability</h4>
        <div className="service-form__grid">
          <label className="service-form__field">
            <span>Expected wait time</span>
            <input
              value={state.waitTime}
              onChange={(e) => handleChange('waitTime', e.target.value)}
              placeholder="e.g. 2–3 weeks"
            />
          </label>
          <label className="service-form__field">
            <span>Notes</span>
            <textarea
              value={state.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Any extra context, referral notes, or eligibility details"
            />
          </label>
          <fieldset className="service-form__field service-form__flags">
            <legend>Opening hours</legend>
            <label className="service-form__checkbox">
              <input
                type="checkbox"
                checked={state.openingHoursStandard}
                onChange={(e) => handleChange('openingHoursStandard', e.target.checked)}
              />
              <span>Standard business hours</span>
            </label>
            <label className="service-form__checkbox">
              <input
                type="checkbox"
                checked={state.openingHoursExtended}
                onChange={(e) => handleChange('openingHoursExtended', e.target.checked)}
              />
              <span>Extended hours</span>
            </label>
            <label className="service-form__checkbox">
              <input
                type="checkbox"
                checked={state.openingHours24_7}
                onChange={(e) => handleChange('openingHours24_7', e.target.checked)}
              />
              <span>24 / 7</span>
            </label>
            {state.openingHoursExtended && (
              <textarea
                className="service-form__textarea"
                value={state.opHoursExtendedDetails}
                onChange={(e) => handleChange('opHoursExtendedDetails', e.target.value)}
                placeholder="Provide details for extended hours"
                rows={2}
              />
            )}
            {errors.opHoursExtendedDetails && (
              <span className="service-form__error">{errors.opHoursExtendedDetails}</span>
            )}
          </fieldset>
        </div>
      </section>

      <footer className="service-form__footer">
        <button className="btn primary" type="submit" disabled={disableSubmit}>
          {disableSubmit ? 'Submitting…' : 'Submit service'}
        </button>
      </footer>
    </form>
  );
}

export function toServiceFormPayload(values: ServiceFormValues): ServiceFormPayload {
  return {
    service_name: values.serviceName,
    organisation_name: values.organisationName,
    campus_name: values.campusName,
    region_name: values.regionName,
    service_type: values.serviceType,
    delivery_method: values.deliveryMethod,
    level_of_care: values.levelOfCare,
    address: values.address,
    suburb: values.suburb,
    state: values.state,
    postcode: values.postcode,
    phone: values.phone,
    email: values.email,
    website: values.website,
    referral_pathway: values.referralPathway,
    cost: values.cost,
    target_population: values.targetPopulation,
    workforce_type: values.workforceType,
    notes: values.notes,
    wait_time: values.waitTime,
    expected_wait_time: values.waitTime,
    opening_hours_24_7: values.openingHours24_7,
    opening_hours_standard: values.openingHoursStandard,
    opening_hours_extended: values.openingHoursExtended,
    op_hours_extended_details: values.opHoursExtendedDetails,
  };
}
