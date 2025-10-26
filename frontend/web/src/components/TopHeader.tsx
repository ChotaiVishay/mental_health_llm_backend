import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useScreenReaderMode } from '@/accessibility/ScreenReaderModeContext';
import MobileMenu from './MobileMenu';

export default function TopHeader() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { screenReaderAssist } = useScreenReaderMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    const source = user?.name ?? user?.email ?? '';
    if (!source) return 'U';
    const parts = source
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2);
    return parts.length
      ? parts.join('').toUpperCase()
      : source.charAt(0).toUpperCase();
  }, [user?.name, user?.email]);

  return (
    <>
      <header className="top-header" data-variant="mobile">
        <a href="#main" className="skip-link">{t('header.skipLink')}</a>
        {screenReaderAssist && (
          <p className="sr-only" aria-live="polite">
            {t('header.screenReader')}
          </p>
        )}

        <div className="top-header-inner">
          <Link to="/" className="top-header-brand" aria-label="Support Atlas home">
            <span aria-hidden className="top-header-logo">SA</span>
            <span className="top-header-name">Support Atlas</span>
          </Link>

          <div className="top-header-actions">
            {loading ? (
              <span className="top-header-status" aria-live="polite">
                {t('header.nav.loading')}
              </span>
            ) : user ? (
              <Link
                to="/profile"
                className="top-header-avatar"
                aria-label="Open profile"
                onClick={() => setMenuOpen(false)}
              >
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials}
              </Link>
            ) : (
              <Link to="/login" className="top-header-signin">
                {t('header.nav.signIn')}
              </Link>
            )}

            <button
              type="button"
              className="top-header-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-controls="mobile-menu-panel"
              aria-expanded={menuOpen}
            >
              <Menu aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
