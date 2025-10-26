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
import { useHashNavigation } from '@/hooks/useHashNavigation';

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
  const handleHashNavigation = useHashNavigation();

  const navLinks = useMemo(() => ([
    { key: 'home', to: '/', label: t('header.nav.home') },
    { key: 'chat', to: '/chat', label: t('header.nav.chat') },
    { key: 'services', to: '/services', label: t('header.nav.services') },
    { key: 'help', to: '/#help-crisis', label: t('header.nav.helpCrisis') },
    { key: 'faq', to: '/#faq', label: t('header.nav.faq') },
    { key: 'accessibility', to: '/accessibility', label: t('header.nav.accessibility') },
  ]), [t]);

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
          </header>
          <label className="mobile-menu-select-label" htmlFor="mobile-language-select">
            {t('header.language.select')}
          </label>
          <div className="mobile-menu-select-wrapper">
            <select
              id="mobile-language-select"
              value={language}
              onChange={(event) => handleLanguageSelect(event.target.value as typeof language)}
            >
              {options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label} — {option.nativeLabel}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mobile-menu-section" aria-label={t('header.menu.explore')}>
          <header className="mobile-menu-section-head">
            <h2>{t('header.menu.explore')}</h2>
          </header>
          <div className="mobile-menu-actions">
            {navLinks.map((link) => {
              const hash = link.to.includes('#') ? link.to.slice(link.to.indexOf('#')) : '';
              return (
                <Link
                  key={link.key}
                  to={link.to}
                  className="mobile-menu-link"
                  onClick={(event) => {
                    if (hash) handleHashNavigation(event, hash);
                    closeMenu();
                  }}
                >
                  {link.label}
                </Link>
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
      </aside>
    </div>
  );
}
