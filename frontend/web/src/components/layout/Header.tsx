import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import Container from './Container';
import { useAuth } from '@/auth/AuthContext';
import { useScreenReaderMode } from '@/accessibility/ScreenReaderModeContext';
import { useLanguage } from '@/i18n/LanguageProvider';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const { screenReaderAssist } = useScreenReaderMode();
  const { t } = useLanguage();

  const initials = useMemo(() => {
    const source = user?.name ?? user?.email ?? '';
    if (!source) return 'U';
    const parts = source
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2);
    return parts.length ? parts.join('').toUpperCase() : source.charAt(0).toUpperCase();
  }, [user?.name, user?.email]);

  const handleSignOut = () => {
    if (signOut) {
      void signOut();
    }
  };

  return (
    <header className="header">
      <Container>
        <a href="#main" className="skip-link">{t('header.skipLink')}</a>
        <div className="header-inner">
          <a href="/" className="brand" aria-label="Support Atlas home">
            <span aria-hidden className="logo">SA</span>
            <span className="brand-name">Support Atlas</span>
          </a>

          <div className="header-right">
            {screenReaderAssist && (
              <p className="sr-only" aria-live="polite">
                {t('header.screenReader')}
              </p>
            )}
            <nav
              className="nav"
              aria-label={screenReaderAssist ? t('header.nav.ariaPrimaryLong') : t('header.nav.ariaPrimaryShort')}
            >
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {t('header.nav.home')}
              </NavLink>
              <NavLink
                to="/chat"
                data-easy-mode="priority"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {t('header.nav.chat')}
              </NavLink>
              {/* Removed Services; add in-page anchors for Help & Crisis and FAQ */}
              <a href="/#help-crisis" data-easy-mode="priority">{t('header.nav.helpCrisis')}</a>
              <a href="/#faq" data-easy-mode="hide">{t('header.nav.faq')}</a>
            </nav>

            <LanguageSwitcher />

            <NavLink
              to="/accessibility"
              className={({ isActive }) => (isActive ? 'accessibility-trigger active' : 'accessibility-trigger')}
            >
              <span className="accessibility-trigger-label">{t('header.nav.accessibility')}</span>
            </NavLink>

            <div className="auth-actions" aria-label={t('header.nav.accountActions')}>
              {loading ? (
                <span className="auth-status" aria-live="polite">{t('header.nav.loading')}</span>
              ) : user ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? 'profile-chip active' : 'profile-chip')}
                  >
                    <span className="profile-chip-avatar" aria-hidden>
                      {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials}
                    </span>
                    <span className="profile-chip-label">
                      <strong>{user.name ?? user.email ?? 'Profile'}</strong>
                      {user.name && user.email && (
                        <small data-easy-mode="hide">{user.email}</small>
                      )}
                    </span>
                  </NavLink>
                  <button type="button" className="btn btn-link auth-signout" onClick={handleSignOut}>
                    {t('header.nav.signOut')}
                  </button>
                </>
              ) : (
                <NavLink to="/login" className="btn btn-secondary">
                  {t('header.nav.signIn')}
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
