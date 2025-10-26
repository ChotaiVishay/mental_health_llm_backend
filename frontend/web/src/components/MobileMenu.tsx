import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageProvider';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button',
  'textarea',
  'input',
  'select',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const {
    language, options, setLanguage, t,
  } = useLanguage();
  const {
    user, loading, signOut,
  } = useAuth();

  const currentLanguageLabel = useMemo(() => {
    const match = options.find((option) => option.code === language);
    return match ? match.label : language.toUpperCase();
  }, [language, options]);

  const closeMenu = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const activeElement = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const focusables = getFocusable(panelRef.current);
    if (focusables.length) {
      focusables[0].focus();
    } else {
      panelRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = getFocusable(panelRef.current);
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
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (activeElement) {
        activeElement.focus();
      }
    };
  }, [closeMenu, open]);

  const handleLanguageSelect = useCallback(
    (code: typeof language) => {
      setLanguage(code);
    },
    [setLanguage],
  );

  const handleSignOut = useCallback(async () => {
    if (signOut) {
      await signOut();
    }
    closeMenu();
  }, [closeMenu, signOut]);

  if (!open) return null;

  return (
    <div className="mobile-menu-root" role="presentation">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="mobile-menu-scrim"
        onClick={closeMenu}
      />

      <aside
        ref={panelRef}
        id="mobile-menu-panel"
        className="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        tabIndex={-1}
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Support Atlas</span>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X aria-hidden className="mobile-menu-close-icon" />
          </button>
        </div>

        <section className="mobile-menu-section" aria-label={t('header.language.label')}>
          <header className="mobile-menu-section-head">
            <h2>{t('header.language.label')}</h2>
            <span className="mobile-menu-section-helper">
              {t('header.language.select')}: {currentLanguageLabel}
            </span>
          </header>
          <div
            role="radiogroup"
            aria-label={t('header.language.select')}
            className="mobile-menu-language-list"
          >
            {options.map((option) => {
              const isActive = option.code === language;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={isActive ? 'mobile-menu-language active' : 'mobile-menu-language'}
                  onClick={() => handleLanguageSelect(option.code)}
                >
                  <span className="mobile-menu-language-label">{option.label}</span>
                  <span className="mobile-menu-language-native">{option.nativeLabel}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mobile-menu-section" aria-label={t('header.nav.accountActions')}>
          <header className="mobile-menu-section-head">
            <h2>{t('header.nav.accountActions')}</h2>
          </header>
          <div className="mobile-menu-actions">
            {loading ? (
              <span aria-live="polite" className="mobile-menu-status">{t('header.nav.loading')}</span>
            ) : user ? (
              <>
                <Link
                  to="/profile"
                  className="mobile-menu-link"
                  onClick={closeMenu}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="mobile-menu-link destructive"
                  onClick={handleSignOut}
                >
                  {t('header.nav.signOut')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="mobile-menu-link"
                onClick={closeMenu}
              >
                {t('header.nav.signIn')}
              </Link>
            )}
          </div>
        </section>

        <section className="mobile-menu-section" aria-label="More information">
          <header className="mobile-menu-section-head">
            <h2>More</h2>
          </header>
          <div className="mobile-menu-actions">
            <Link
              to="/accessibility"
              className="mobile-menu-link"
              onClick={closeMenu}
            >
              Accessibility
            </Link>
            <Link
              to="/contact"
              className="mobile-menu-link"
              onClick={closeMenu}
            >
              Contact
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
