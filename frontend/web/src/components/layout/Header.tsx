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
            <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Services
            </NavLink>
            <NavLink to="/help" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Help &amp; Crisis
            </NavLink>
          </nav>
        </div>
      </Container>
    </header>
  );
}