import { NavLink } from 'react-router-dom';
import Container from './Container';

export default function Header() {
  return (
    <header className="header">
      <Container as="div">
        <div className="nav" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>Support Atlas</strong>
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
          {/* Go to the admin console; RequireAdmin will bounce to /admin/signin if not logged in */}
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Admin
          </NavLink>
        </div>
      </Container>
    </header>
  );
}