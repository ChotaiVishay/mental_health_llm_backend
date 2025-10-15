import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import Container from './Container';
import { useAuth } from '@/auth/AuthContext';

export default function Header() {
  const { user, loading, signOut } = useAuth();

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
        <div className="header-inner">
          <a href="/" className="brand" aria-label="Support Atlas home">
            <span aria-hidden className="logo">SA</span>
            <span className="brand-name">Support Atlas</span>
          </a>

          <div className="header-right">
            <nav className="nav" aria-label="Primary">
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Home
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Chat
              </NavLink>
              {/* Removed Services; add in-page anchors for Help & Crisis and FAQ */}
              <a href="/#help-crisis">Help &amp; Crisis</a>
              <a href="/#faq">FAQ</a>
            </nav>

            <div className="auth-actions" aria-label="Account actions">
              {loading ? (
                <span className="auth-status" aria-live="polite">Loading…</span>
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
                        <small>{user.email}</small>
                      )}
                    </span>
                  </NavLink>
                  <button type="button" className="btn btn-link auth-signout" onClick={handleSignOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <NavLink to="/login" className="btn btn-secondary">
                  Sign in
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
