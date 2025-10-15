import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // pass a simple string to make Login redirect trivial
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}