import { useEffect, useId, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';

type AgreementsModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  repeatRequired?: boolean;
  versions?: { termsVersion?: string; privacyVersion?: string };
  onAccept: () => void;
  onCancel: () => void;
};

export default function AgreementsModal({
  open,
  loading,
  error,
  repeatRequired,
  versions,
  onAccept,
  onCancel,
}: AgreementsModalProps) {
  const termsCheckboxId = useId();
  const privacyCheckboxId = useId();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const { t, list } = useLanguage();
  const termsPoints = list('agreements.terms.points');
  const privacyPoints = list('agreements.privacy.points');

  useEffect(() => {
    if (open) {
      setAcceptTerms(false);
      setAcceptPrivacy(false);
    }
  }, [open]);

  if (!open) return null;

  const disabled = loading || !acceptTerms || !acceptPrivacy;
  const versionNote = [
    versions?.termsVersion ? `Terms v${versions.termsVersion}` : null,
    versions?.privacyVersion ? `Privacy v${versions.privacyVersion}` : null,
  ]
    .filter(Boolean)
    .join(t('agreements.versionNoteSeparator'));

  return (
    <div className="chat-agreements-backdrop" role="presentation">
      <div
        className="chat-agreements-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-legal-title"
        aria-label={t('agreements.modal.aria')}
      >
        <div className="chat-agreements-content">
          <header>
            <h2 id="chat-legal-title" style={{ margin: 0 }}>
              {t('agreements.title')}
            </h2>
            {versionNote && (
              <p className="muted" style={{ margin: '6px 0 0 0' }}>
                {versionNote}
              </p>
            )}
            {repeatRequired && (
              <p style={{ margin: '8px 0 0 0' }}>
                {t('agreements.repeat')}
              </p>
            )}
          </header>

          <div className="chat-agreements-scroll">
            <section className="chat-agreements-section" aria-labelledby="chat-terms-heading">
              <h3 id="chat-terms-heading">{t('agreements.terms.heading')}</h3>
              <p>{t('agreements.terms.intro')}</p>
              <ul>
                {termsPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="chat-agreements-section" aria-labelledby="chat-privacy-heading">
              <h3 id="chat-privacy-heading">{t('agreements.privacy.heading')}</h3>
              <p>{t('agreements.privacy.intro')}</p>
              <ul>
                {privacyPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <ul className="chat-agreements-checklist">
            <li>
              <label htmlFor={termsCheckboxId} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input
                  id={termsCheckboxId}
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  disabled={loading}
                />
                <span>{t('agreements.checkbox.terms')}</span>
              </label>
            </li>
            <li>
              <label htmlFor={privacyCheckboxId} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input
                  id={privacyCheckboxId}
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(event) => setAcceptPrivacy(event.target.checked)}
                  disabled={loading}
                />
                <span>{t('agreements.checkbox.privacy')}</span>
              </label>
            </li>
          </ul>

          {error && (
            <div className="chat-agreements-error" role="alert">
              {error}
            </div>
          )}

          <div className="chat-agreements-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              {t('agreements.actions.back')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAccept}
              disabled={disabled}
            >
              {loading ? t('agreements.actions.saving') : t('agreements.actions.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
