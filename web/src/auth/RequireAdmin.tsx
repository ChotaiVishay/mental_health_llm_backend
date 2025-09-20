import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const loc = useLocation();

  const isAdmin =
    !!user && (user as unknown as { isAdmin?: boolean }).isAdmin === true;

  if (!isAdmin) {
    // Send non-admins (or logged-out users) to the admin login page
    return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  }

  return children;
}