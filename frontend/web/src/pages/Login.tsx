// src/pages/Login.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

type FromState = { from?: string };

export default function Login() {
  const { signIn } = useAuth(); // signIn is optional on the context
  const nav = useNavigate();
  const loc = useLocation();

  // Will be something like "/chat" if redirected by RequireAuth, else "/"
  const from = (loc.state as FromState)?.from ?? '/';

  const start = async (provider: 'google' | 'apple' | 'github') => {
    // Guard the optional function; okay to navigate even if signIn is absent (mock mode)
    if (signIn) {
      await signIn(provider, from);
    }
    nav(from, { replace: true });
  };

  const disabled = !signIn; // Nice UX hint if the auth client hasn’t initialised yet

  return (
    <section>
      <h1>Sign in</h1>
      <p style={{ color: '#6B7280' }}>Authenticate to continue.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn primary" onClick={() => start('google')} disabled={disabled} aria-disabled={disabled}>
          Continue with Google
        </button>
        <button className="btn" onClick={() => start('github')} disabled={disabled} aria-disabled={disabled}>
          Continue with GitHub
        </button>
        <button className="btn" onClick={() => start('apple')} disabled={disabled} aria-disabled={disabled}>
          Continue with Apple
        </button>
      </div>
    </section>
  );
}