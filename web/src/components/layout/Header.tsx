import { NavLink } from 'react-router-dom';
import Container from './Container';

export default function Header() {
  return (
    <header className="header">
      <Container>
        <div className="header-inner">
          <a href="/" className="brand" aria-label="Support Atlas home">
            <span aria-hidden className="logo">SA</span>
            <span className="brand-name">Support Atlas</span>
          </a>

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
        </div>
      </Container>
    </header>
  );
}