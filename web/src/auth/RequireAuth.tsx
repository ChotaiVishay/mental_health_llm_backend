import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // send user to /login and remember where they wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}