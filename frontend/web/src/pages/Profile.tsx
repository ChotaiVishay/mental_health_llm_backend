import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useAuth } from '@/auth/AuthContext';
import { getSupabaseClient } from '@/auth/supabaseClient';
import type { User } from '@/auth/types';
import '@/styles/pages/profile.css';

function mapSupabaseUser(u: SupabaseUser): User {
  const metadata = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: u.id,
    name: (metadata.full_name as string | undefined) ?? u.email ?? undefined,
    email: u.email ?? undefined,
    avatarUrl: (metadata.avatar_url as string | undefined) ?? undefined,
  };
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const supabase = getSupabaseClient();

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setDisplayName(user?.name ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user?.id, user?.name, user?.avatarUrl]);

  const initials = useMemo(() => {
    const source = user?.name ?? user?.email ?? '';
    if (!source) return 'U';
    const parts = source
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2);
    return parts.length ? parts.join('').toUpperCase() : source.charAt(0).toUpperCase();
  }, [user?.name, user?.email]);

  if (!user) {
    return null;
  }

  const onSaveProfile = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setProfileError(null);
    setProfileStatus(null);

    if (!supabase) {
      setProfileError('Profile editing is unavailable in this environment.');
      return;
    }

    setProfileLoading(true);
    try {
      const name = displayName.trim();
      const avatar = avatarUrl.trim();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: name || null,
          avatar_url: avatar || null,
        },
      });
      if (error) {
        setProfileError(error.message);
        return;
      }
      if (data.user && setUser) {
        setUser(mapSupabaseUser(data.user));
      }
      setProfileStatus('Account details updated.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setPasswordError(null);
    setPasswordStatus(null);

    if (!supabase) {
      setPasswordError('Password updates are unavailable in this environment.');
      return;
    }

    const trimmed = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmed || trimmed.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (trimmed !== trimmedConfirm) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error, data } = await supabase.auth.updateUser({ password: trimmed });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      if (data.user && setUser) {
        setUser(mapSupabaseUser(data.user));
      }
      setPasswordStatus('Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <div className="profile-card" role="region" aria-live="polite">
        <header className="profile-header">
          <div className="profile-avatar" aria-hidden>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <h1 id="profile-title" className="profile-title">Your profile</h1>
            <p className="profile-summary">
              Manage your account details and keep information up to date.
            </p>
            <p className="profile-email">
              Signed in as <strong>{user.email ?? 'unknown email'}</strong>
            </p>
          </div>
        </header>

        <section className="profile-section" aria-labelledby="profile-account-heading">
          <div className="profile-section-head">
            <h2 id="profile-account-heading">Account details</h2>
            <p className="muted">Update your display name and avatar.</p>
          </div>
          <form className="profile-form" onSubmit={onSaveProfile} noValidate>
            <fieldset disabled={profileLoading}>
              <label className="field">
                <span>Display name</span>
                <input
                  type="text"
                  name="display-name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(evt) => setDisplayName(evt.target.value)}
                />
              </label>

              <label className="field">
                <span>Avatar URL</span>
                <input
                  type="url"
                  name="avatar-url"
                  placeholder="https://example.com/avatar.png"
                  autoComplete="url"
                  value={avatarUrl}
                  onChange={(evt) => setAvatarUrl(evt.target.value)}
                />
              </label>

              {profileError && (
                <p className="error" role="alert">
                  {profileError}
                </p>
              )}
              {profileStatus && (
                <p className="status" role="status">
                  {profileStatus}
                </p>
              )}

              <div className="profile-actions">
                <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                  Save changes
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        <section className="profile-section" aria-labelledby="profile-security-heading">
          <div className="profile-section-head">
            <h2 id="profile-security-heading">Security</h2>
            <p className="muted">Change your password after verifying with email sign-in.</p>
          </div>
          <form className="profile-form" onSubmit={onChangePassword} noValidate>
            <fieldset disabled={passwordLoading}>
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  minLength={6}
                  required
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
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(evt) => setConfirmPassword(evt.target.value)}
                />
              </label>

              {passwordError && (
                <p className="error" role="alert">
                  {passwordError}
                </p>
              )}
              {passwordStatus && (
                <p className="status" role="status">
                  {passwordStatus}
                </p>
              )}

              <div className="profile-actions">
                <button type="submit" className="btn btn-secondary" disabled={passwordLoading}>
                  Update password
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
    </section>
  );
}
