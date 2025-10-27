import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { getSupabaseClient } from '@/auth/supabaseClient';
import { mapSupabaseUser } from '@/auth/mapSupabaseUser';
import { getSupabaseAdminClient } from '@/admin/supabaseAdminClient';
import { useTranslation } from '@/i18n/LanguageProvider';
import '@/styles/pages/profile.css';
import { VITE } from '@/utils/env';

export default function Profile() {
  const { user, setUser } = useAuth();
  const supabase = getSupabaseClient();
  const adminClient = getSupabaseAdminClient();
  const t = useTranslation();

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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.name ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [
    user?.id,
    user?.name,
    user?.avatarUrl,
  ]);

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
      setProfileError(t('profile.error.unavailable'));
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
      setProfileStatus(t('profile.status.updated'));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : t('profile.error.generic'));
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setPasswordError(null);
    setPasswordStatus(null);

    if (!supabase) {
      setPasswordError(t('profile.error.passwordUnavailable'));
      return;
    }

    const trimmed = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmed || trimmed.length < 6) {
      setPasswordError(t('profile.error.passwordLength'));
      return;
    }
    if (trimmed !== trimmedConfirm) {
      setPasswordError(t('profile.error.passwordMismatch'));
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
      setPasswordStatus(t('profile.status.passwordUpdated'));
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('profile.error.passwordGeneric'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const onDeleteAccount = async () => {
    setDeleteError(null);
    if (!user) return;

    const confirmed = window.confirm(t('profile.delete.confirm'));
    if (!confirmed) return;

    if (!adminClient) {
      setDeleteError(t('profile.error.deleteUnavailable'));
      return;
    }
    if (!supabase) {
      setDeleteError(t('profile.error.authUnavailable'));
      return;
    }

    setDeleteLoading(true);
    try {
      const { error } = await adminClient.auth.admin.deleteUser(user.id);
      if (error) {
        throw new Error(error.message);
      }

      await supabase.auth.signOut();
      if (setUser) setUser(null);

      const safeRedirect = VITE.VITE_APP_BASE_URL?.trim() || '/';
      window.location.href = safeRedirect;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('profile.error.deleteGeneric'));
    } finally {
      setDeleteLoading(false);
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
            <h1 id="profile-title" className="profile-title">{t('profile.title')}</h1>
            <p className="profile-summary">
              {t('profile.summary')}
            </p>
            <p className="profile-email">
              {t('profile.signedInPrefix')}{' '}
              <strong>{user.email ?? t('profile.signedInUnknown')}</strong>
            </p>
          </div>
        </header>

        <section className="profile-section" aria-labelledby="profile-account-heading">
          <div className="profile-section-head">
            <h2 id="profile-account-heading">{t('profile.section.account.title')}</h2>
            <p className="muted">{t('profile.section.account.description')}</p>
          </div>
          <form className="profile-form" onSubmit={onSaveProfile} noValidate>
            <fieldset disabled={profileLoading}>
              <label className="field">
                <span>{t('profile.field.displayName')}</span>
                <input
                  type="text"
                  name="display-name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(evt) => setDisplayName(evt.target.value)}
                />
              </label>

              <label className="field">
                <span>{t('profile.field.avatarUrl')}</span>
                <input
                  type="url"
                  name="avatar-url"
                  placeholder={t('profile.field.avatarUrl.placeholder')}
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
                  {profileLoading ? t('profile.button.saving') : t('profile.button.save')}
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        <section className="profile-section" aria-labelledby="profile-security-heading">
          <div className="profile-section-head">
            <h2 id="profile-security-heading">{t('profile.section.security.title')}</h2>
            <p className="muted">{t('profile.section.security.description')}</p>
          </div>
          <form className="profile-form" onSubmit={onChangePassword} noValidate>
            <fieldset disabled={passwordLoading}>
              <label className="field">
                <span>{t('profile.field.newPassword')}</span>
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
                <span>{t('profile.field.confirmPassword')}</span>
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
                  {passwordLoading ? t('profile.button.updatingPassword') : t('profile.button.updatePassword')}
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        <section className="profile-section profile-danger" aria-labelledby="profile-danger-heading">
          <div className="profile-section-head">
            <h2 id="profile-danger-heading">{t('profile.section.delete.title')}</h2>
            <p className="muted">{t('profile.section.delete.description')}</p>
          </div>
          {deleteError && (
            <p className="error" role="alert">{deleteError}</p>
          )}
          <div className="profile-actions">
            <button
              type="button"
              className="btn btn-crisis"
              onClick={onDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? t('profile.button.deleting') : t('profile.button.delete')}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
