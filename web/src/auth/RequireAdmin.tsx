import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Minimal admin gate:
 * - If no user is logged in, go to /admin/signin (with return path).
 * - If you later add roles, check user.role === 'admin' here.
 */
export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/signin" state={{ from: location.pathname }} replace />;
  }

  // If you add role-based access:
  // if ((user as any).role !== 'admin') return <Navigate to="/" replace />;

  return children;
}