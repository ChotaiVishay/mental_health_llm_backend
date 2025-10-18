import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { JSX } from 'react';

/**
 * Minimal admin gate:
 * - If no user is logged in, go to /admin/signin (with return path).
 * - If you later add roles, check user.role === 'admin' here.
 */
type Props = { children: JSX.Element; roles?: Array<'superadmin' | 'admin' | 'org_admin'> };

export default function RequireAdmin({ children, roles = ['superadmin', 'admin', 'org_admin'] }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/signin" state={{ from: location.pathname }} replace />;
  }

  // Role-based access: allow superadmin/admin/org_admin by default
  const userRole = (user as any).role as string | undefined;
  if (userRole && !roles.includes(userRole as any)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
