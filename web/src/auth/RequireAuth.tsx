import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div aria-busy="true">Loading…</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}