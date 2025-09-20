// web/src/pages/admin/AdminSignIn.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function AdminSignIn() {
  const nav = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) nav('/admin', { replace: true });
  }, [user, nav]);

  return (
    <main>
      <h1>Admin sign-in</h1>
      <p>Sign in to access the admin console.</p>
      <button onClick={() => signIn('google', '/admin')}>Continue with Google</button>
    </main>
  );
}