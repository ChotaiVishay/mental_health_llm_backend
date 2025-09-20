// src/pages/Login.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

type FromState = { from?: string };

function isFromState(state: unknown): state is FromState {
  return (
    typeof state === 'object' &&
    state !== null &&
    ('from' in state ? typeof (state as Record<string, unknown>).from === 'string' : true)
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const from = isFromState(loc.state) && loc.state.from ? loc.state.from : '/';

  const start = async (provider: 'google' | 'apple' | 'github') => {
    await signIn(provider, from);
    nav(from, { replace: true });
  };

  return (
    <section>
      <h1>Sign in</h1>
      <p style={{ color: '#6B7280' }}>Authenticate to continue.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn primary" onClick={() => start('google')}>
          Continue with Google
        </button>
        <button className="btn" onClick={() => start('github')}>
          Continue with GitHub
        </button>
        <button className="btn" onClick={() => start('apple')}>
          Continue with Apple
        </button>
      </div>
    </section>
  );
}