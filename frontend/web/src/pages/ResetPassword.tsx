import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { getSupabaseClient } from '@/auth/supabaseClient';

export default function ResetPassword() {
  const { resetPassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          if (!cancelled) {
            setError('Password reset is unavailable right now. Please try again later.');
            setReady(false);
          }
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          setError('This password reset link is invalid or has expired. Request a new link from the sign-in page.');
          setReady(false);
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) {
          setError('Something went wrong while preparing password reset. Please try again.');
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (redirectTimer.current && typeof window !== 'undefined') {
        window.clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const onSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setError(null);
    setStatus(null);

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Enter a new password.');
      return;
    }
    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (trimmedPassword !== confirm.trim()) {
      setError('Passwords do not match.');
      return;
    }
    if (!resetPassword) {
      setError('Password reset is unavailable right now.');
      return;
    }

    const result = await resetPassword(trimmedPassword);
    if (!result.ok) {
      setError(result.error ?? 'Unable to update password.');
      return;
    }

    setStatus('Password updated. Redirecting you to your account…');
    if (typeof window !== 'undefined') {
      redirectTimer.current = window.setTimeout(() => {
        nav('/', { replace: true });
      }, 1500);
    } else {
      nav('/', { replace: true });
    }
  };

  const disableForm = loading || !ready;

  return (
    <section className="auth-page" aria-labelledby="reset-title">
      <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <h1 id="reset-title" className="h1">Choose a new password</h1>
        <p className="muted">
          Enter and confirm your new password to finish resetting your account.
        </p>

        <form className="email-auth" onSubmit={onSubmit} noValidate>
          <fieldset disabled={disableForm}>
            <legend className="sr-only">Reset password</legend>

            <label className="field">
              <span>New password</span>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(evt) => setPassword(evt.target.value)}
              />
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(evt) => setConfirm(evt.target.value)}
              />
            </label>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {status && (
              <p className="status" role="status">
                {status}
              </p>
            )}

            <button type="submit" className="btn btn-primary">
              Update password
            </button>
          </fieldset>
        </form>

        <div className="auth-foot">
          <button
            type="button"
            className="linklike"
            onClick={() => nav('/login')}
            disabled={loading}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </section>
  );
}
