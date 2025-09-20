import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from || '/';

  const start = async (provider: 'google' | 'apple' | 'github') => {
    await signIn(provider, from);
    // in mock mode, we arrive back here without redirect → go to 'from'
    nav(from, { replace: true });
  };

  return (
    <section>
      <h1>Sign in</h1>
      <p style={{ color: '#6B7280' }}>Authenticate to continue.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn primary" onClick={() => start('google')}>Continue with Google</button>
        <button className="btn" onClick={() => start('github')}>Continue with GitHub</button>
        <button className="btn" onClick={() => start('apple')}>Continue with Apple</button>
      </div>
    </section>
  );
}