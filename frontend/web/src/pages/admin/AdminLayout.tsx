import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/admin/AdminAuthContext';
import '@/styles/pages/admin.css';

const SECTIONS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/providers', label: 'Providers' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/admins', label: 'Admins' },
  { to: '/admin/profile', label: 'My Profile' },
];

export default function AdminLayout() {
  const { admin, logout, loading } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/signin');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-account">
          <span className="admin-name">{admin?.first_name || admin?.username}</span>
          <span className="admin-role">{admin?.profile.role ?? 'admin'}</span>
          <button type="button" className="btn -ghost" onClick={handleLogout} disabled={loading}>
            Sign out
          </button>
        </div>
        <nav aria-label="Admin navigation">
          <ul>
            {SECTIONS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
