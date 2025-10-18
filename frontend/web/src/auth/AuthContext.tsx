// web/src/auth/AuthContext.tsx
import React, {
  createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type { User } from './types';
import { getAuth, clearAuth, saveAuth } from './storage';
import { signIn as clientSignIn, parseCallbackAndStore } from './client';
import { mergePreloginIntoUser } from '@/features/chat/sessionStore';
import { getSupabaseClient } from './supabaseClient';
import { VITE } from '@/utils/env';

type EmailCredentials = { email: string; password: string };
type EmailSignUpPayload = EmailCredentials & { name?: string };
type EmailAuthResult = { ok: boolean; error?: string; needsVerification?: boolean };
type EmailVerificationPayload = {
  email: string;
  password: string;
  token: string;
  name?: string;
};
type EmailVerificationResult = { ok: boolean; error?: string };
type PasswordResetRequestResult = { ok: boolean; error?: string };
type PasswordUpdateResult = { ok: boolean; error?: string };

type SignInResult = { redirected: boolean };

type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: (provider: 'google' | 'github' | 'apple', returnTo?: string) => Promise<SignInResult | void>;
  signOut: () => Promise<void>;
  finishAuth: () => Promise<string | undefined>;
  emailSignIn: (creds: EmailCredentials) => Promise<EmailAuthResult>;
  emailSignUp: (payload: EmailSignUpPayload) => Promise<EmailAuthResult>;
  verifyEmailSignUp: (payload: EmailVerificationPayload) => Promise<EmailVerificationResult>;
  resendEmailSignUp: (email: string) => Promise<EmailAuthResult>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResult>;
  resetPassword: (password: string) => Promise<PasswordUpdateResult>;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>; // handy for tests
};

const AuthContext = createContext<Ctx>({
  user: null,
  loading: false,
  // safe no-ops as defaults
  async signIn() { return undefined; },
  async signOut() {},
  async finishAuth() { return undefined; },
  async emailSignIn() { return { ok: false, error: 'Email sign-in unavailable' }; },
  async emailSignUp() { return { ok: false, error: 'Email sign-up unavailable' }; },
  async verifyEmailSignUp() { return { ok: false, error: 'Email verification unavailable' }; },
  async resendEmailSignUp() { return { ok: false, error: 'Email verification unavailable' }; },
  async requestPasswordReset() { return { ok: false, error: 'Password reset unavailable' }; },
  async resetPassword() { return { ok: false, error: 'Password update unavailable' }; },
});

function commitSession(session: Session | null, setUser: React.Dispatch<React.SetStateAction<User | null>>) {
  if (!session?.user) {
    clearAuth();
    setUser(null);
    return;
  }

  const supaUser = session.user;
  const metadata = (supaUser.user_metadata ?? {}) as Record<string, unknown>;
  const mapped: User = {
    id: supaUser.id,
    name: (metadata.full_name as string | undefined) ?? supaUser.email ?? undefined,
    email: supaUser.email ?? undefined,
    avatarUrl: (metadata.avatar_url as string | undefined) ?? undefined,
  };

  setUser(mapped);
  if (session.access_token) saveAuth(session.access_token, mapped);
  const uid = String(mapped.id ?? '');
  if (uid) mergePreloginIntoUser(uid);
}

async function attachProfileRole(setUser: React.Dispatch<React.SetStateAction<User | null>>) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    // Try app_metadata first
    const appMeta = (auth.user?.app_metadata ?? {}) as Record<string, unknown>;
    const metaRole = (appMeta.role as string | undefined) || undefined;
    const metaRoles = (appMeta.roles as string[] | undefined) || undefined;
    if (metaRole || metaRoles) {
      setUser((prev) => (prev ? { ...prev, role: metaRole as any, roles: metaRoles } : prev));
    }
    // Also try profiles table for canonical role/org
    const { data, error } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', uid)
      .single();
    if (!error && data) {
      setUser((prev) => (prev ? { ...prev, role: (data.role as any) ?? prev.role, org_id: (data as any).organization_id ?? null } : prev));
    }
  } catch {
    // ignore — UI gating is secondary to RLS
  }
}

type AuthProviderProps = {
  children: ReactNode;
  initialState?: { user?: User | null; loading?: boolean };
};

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialState?.user ?? null);
  const [loading, setLoading] = useState<boolean>(initialState?.loading ?? false);
  const supabase = getSupabaseClient();
  const isMockAuth = VITE.VITE_AUTH_MOCK === '1' || !supabase;

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      setLoading(true);
      try {
        if (isMockAuth) {
          const { user: stored } = getAuth();
          if (!mounted) return;
          setUser((stored as User | null) ?? null);
          return;
        }
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        commitSession(data.session, setUser);
        await attachProfileRole(setUser);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    hydrate();

    if (!isMockAuth && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        commitSession(session, setUser);
        await attachProfileRole(setUser);
      });
      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isMockAuth, supabase]);

  const signIn = useCallback(async (provider: 'google' | 'github' | 'apple', returnTo?: string) => {
    setLoading(true);
    try {
      const { redirected } = await clientSignIn(provider, returnTo);
      return { redirected } as SignInResult;
      // In real OAuth you’ll be redirected; in mock mode you’ll return here.
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      if (!isMockAuth && supabase) {
        await supabase.auth.signOut();
      }
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  /** Called after OAuth callback: hydrate user & merge pre-login chat */
  const finishAuth = useCallback(async () => {
    setLoading(true);
    try {
      const state = await parseCallbackAndStore();
      if (isMockAuth) {
        const { user: stored } = getAuth();
        if (stored) {
          setUser(stored as User);
          const uid = String((stored as User).id ?? '');
          if (uid) mergePreloginIntoUser(uid);
        }
        return state;
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        commitSession(data.session, setUser);
        await attachProfileRole(setUser);
      }
      return state;
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const emailSignIn = useCallback(async ({ email, password }: EmailCredentials): Promise<EmailAuthResult> => {
    setLoading(true);
    try {
      const normalisedEmail = email.trim().toLowerCase();
      if (!normalisedEmail || !password) {
        return { ok: false, error: 'Email and password are required.' };
      }

      if (isMockAuth || !supabase) {
        const mockUser: User = { id: normalisedEmail, email: normalisedEmail, name: normalisedEmail };
        saveAuth('mock-token', mockUser);
        setUser(mockUser);
        mergePreloginIntoUser(mockUser.id);
        return { ok: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: normalisedEmail, password });
      if (error) return { ok: false, error: error.message };
      commitSession(data.session, setUser);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Email sign-in failed.',
      };
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const emailSignUp = useCallback(async ({ email, password, name }: EmailSignUpPayload): Promise<EmailAuthResult> => {
    setLoading(true);
    try {
      const normalisedEmail = email.trim().toLowerCase();
      if (!normalisedEmail || !password) {
        return { ok: false, error: 'Email and password are required.' };
      }

      if (isMockAuth || !supabase) {
        const mockUser: User = { id: normalisedEmail, email: normalisedEmail, name: name || normalisedEmail };
        saveAuth('mock-token', mockUser);
        setUser(mockUser);
        mergePreloginIntoUser(mockUser.id);
        return { ok: true };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalisedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
          data: name ? { full_name: name } : undefined,
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, needsVerification: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Sign-up failed.',
      };
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const verifyEmailSignUp = useCallback(async ({
    email,
    password,
    token,
    name,
  }: EmailVerificationPayload): Promise<EmailVerificationResult> => {
    setLoading(true);
    try {
      const normalisedEmail = email.trim().toLowerCase();
      const trimmedToken = token.trim();
      if (!normalisedEmail || !trimmedToken) {
        return { ok: false, error: 'Email and verification code are required.' };
      }

      if (isMockAuth || !supabase) {
        const mockUser: User = {
          id: normalisedEmail,
          email: normalisedEmail,
          name: name || normalisedEmail,
        };
        saveAuth('mock-token', mockUser);
        setUser(mockUser);
        mergePreloginIntoUser(mockUser.id);
        return { ok: true };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: normalisedEmail,
        token: trimmedToken,
        type: 'email',
      });

      if (error || !data.session) {
        return { ok: false, error: error?.message ?? 'Invalid or expired verification code.' };
      }

      commitSession(data.session, setUser);

      const updatePayload: {
        password?: string;
        data?: Record<string, unknown>;
      } = {};

      if (password) updatePayload.password = password;
      if (name) updatePayload.data = { full_name: name };

      if (Object.keys(updatePayload).length > 0) {
        const { data: updated, error: updateError } = await supabase.auth.updateUser(updatePayload); 
        if (updateError) {
          return { ok: false, error: updateError.message };
        }
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) commitSession(sessionData.session, setUser);
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Verification failed.',
      };
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const resendEmailSignUp = useCallback(async (email: string): Promise<EmailAuthResult> => {
    setLoading(true);
    try {
      const normalisedEmail = email.trim().toLowerCase();
      if (!normalisedEmail) {
        return { ok: false, error: 'Email is required.' };
      }

      if (isMockAuth || !supabase) {
        return { ok: true, needsVerification: true };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalisedEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, needsVerification: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to resend verification code.',
      };
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const requestPasswordReset = useCallback(async (email: string): Promise<PasswordResetRequestResult> => {
    setLoading(true);
    try {
      const normalisedEmail = email.trim().toLowerCase();
      if (!normalisedEmail) {
        return { ok: false, error: 'Email is required.' };
      }

      if (isMockAuth || !supabase) {
        return { ok: true };
      }

      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(normalisedEmail, { redirectTo });
      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to send password reset email.',
      };
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const resetPassword = useCallback(async (password: string): Promise<PasswordUpdateResult> => {
    setLoading(true);
    try {
      const trimmed = password.trim();
      if (!trimmed) {
        return { ok: false, error: 'Password is required.' };
      }
      if (trimmed.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters long.' };
      }

      if (isMockAuth || !supabase) {
        return { ok: true };
      }

      const { error } = await supabase.auth.updateUser({ password: trimmed });
      if (error) {
        return { ok: false, error: error.message };
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) commitSession(data.session, setUser);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to update password.',
      };
    } finally {
      setLoading(false);
    }
  }, [isMockAuth, supabase]);

  const value = useMemo<Ctx>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      finishAuth,
      emailSignIn,
      emailSignUp,
      verifyEmailSignUp,
      resendEmailSignUp,
      requestPasswordReset,
      resetPassword,
      setUser,
    }),
    [
      user,
      loading,
      signIn,
      signOut,
      finishAuth,
      emailSignIn,
      emailSignUp,
      verifyEmailSignUp,
      resendEmailSignUp,
      requestPasswordReset,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
