import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/admin/AdminAuthContext';
import { JSX } from 'react';

/**
 * Minimal admin gate:
 * - If no user is logged in, go to /admin/signin (with return path).
 * - If you later add roles, check user.role === 'admin' here.
 */
export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <p>Checking admin access…</p>;

  if (!admin) {
    return <Navigate to="/admin/signin" state={{ from: location.pathname }} replace />;
  }

  // If you add role-based access:
  // if ((user as any).role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
