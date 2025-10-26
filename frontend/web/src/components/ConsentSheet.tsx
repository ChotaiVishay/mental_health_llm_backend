import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { CONSENT_VERSION } from '@/constants/consent';

type ConsentSheetProps = {
  open: boolean;
  onAccept: () => void;
  onDismiss: () => void;
};

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export default function ConsentSheet({ open, onAccept, onDismiss }: ConsentSheetProps) {
  const { t, list } = useLanguage();
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [agreed, setAgreed] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return () => {};
    const el = document.createElement('div');
    el.className = 'consent-sheet-portal';
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
      setPortalEl(null);
    };
  }, []);

  useEffect(() => {
    if (!open) return () => {};

    setAgreed(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = getFocusable(sheetRef.current);
    if (focusables.length) {
      window.setTimeout(() => focusables[0].focus(), 0);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = getFocusable(sheetRef.current);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const handleAccept = useCallback(() => {
    if (!agreed) return;
    onAccept();
  }, [agreed, onAccept]);

  const termsPoints = useMemo(() => list('agreements.terms.points'), [list]);
  const privacyPoints = useMemo(() => list('agreements.privacy.points'), [list]);
  const versionLabel = useMemo(
    () => t('agreements.versionLabel').replace('{version}', CONSENT_VERSION),
    [t],
  );

  if (!portalEl || !open) return null;

  return createPortal(
    (
      <div className="consent-sheet-overlay" role="presentation">
        <section
          ref={sheetRef}
          className="consent-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-sheet-title"
        >
          <header className="consent-sheet-header">
            <div>
              <h2 id="consent-sheet-title">{t('agreements.title')}</h2>
              <p id="consent-sheet-intro" className="consent-sheet-intro">
                {t('agreements.sheet.intro')}
              </p>
              <p className="consent-sheet-version">
                {versionLabel}
              </p>
            </div>
            <button
              type="button"
              className="consent-sheet-close"
              onClick={handleDismiss}
              aria-label={t('agreements.actions.back')}
            >
              <X aria-hidden className="consent-sheet-close-icon" />
            </button>
          </header>

          <div
            className="consent-sheet-body"
            role="document"
            aria-describedby="consent-sheet-intro"
          >
            <section aria-labelledby="consent-terms-heading" className="consent-section">
              <h3 id="consent-terms-heading">{t('agreements.terms.heading')}</h3>
              <p>{t('agreements.terms.intro')}</p>
              <ul>
                {termsPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="consent-privacy-heading" className="consent-section">
              <h3 id="consent-privacy-heading">{t('agreements.privacy.heading')}</h3>
              <p>{t('agreements.privacy.intro')}</p>
              <ul>
                {privacyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="consent-sheet-footer">
            <label className="consent-sheet-checkbox">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>{t('agreements.checkbox.consent')}</span>
            </label>
            <button
              type="button"
              className="btn btn-primary consent-sheet-accept"
              onClick={handleAccept}
              disabled={!agreed}
            >
              {t('agreements.actions.accept')}
            </button>
          </footer>
        </section>
      </div>
    ),
    portalEl,
  );
}
