import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Title from '@/components/misc/Title';
import '@/styles/pages/login.css';
import { useAdminAuth } from '@/admin/AdminAuthContext';

export default function AdminSignIn() {
  const { login, loading, error } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | undefined)?.from ?? '/admin';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!username.trim() || !password) {
      setLocalError('Please enter your email/username and password.');
      return;
    }
    const result = await login(username.trim(), password);
    if (result.ok) {
      navigate(from, { replace: true });
    } else if (result.error) {
      setLocalError(result.error);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="admin-auth-title">
      <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="admin-auth-title">
        <Title value="Admin sign-in" />
        <h1 id="admin-auth-title" className="h1">Administrator sign-in</h1>
        <p className="muted">Sign in with your administrative credentials.</p>

        {(localError || error) && (
          <p role="alert" className="error">
            {localError || error}
          </p>
        )}

        <form className="form" onSubmit={onSubmit}>
          <label className="form-field">
            <span>Email or username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}
