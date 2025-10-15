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

type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: (provider: 'google' | 'github' | 'apple', returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  finishAuth: () => Promise<string | undefined>;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>; // handy for tests
};

const AuthContext = createContext<Ctx>({
  user: null,
  loading: false,
  // safe no-ops as defaults
  async signIn() {},
  async signOut() {},
  async finishAuth() { return undefined; },
});

type AuthProviderProps = {
  children: ReactNode;
  initialState?: { user?: User | null; loading?: boolean };
};

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialState?.user ?? null);
  const [loading, setLoading] = useState<boolean>(initialState?.loading ?? false);
  const supabase = getSupabaseClient();
  const isMockAuth = VITE.VITE_AUTH_MOCK === '1' || !supabase;

  const applySession = useCallback(
    (session: Session | null) => {
      if (!session?.user) {
        clearAuth();
        setUser(null);
        return;
      }
      const supaUser = session.user;
      const mapped: User = {
        id: supaUser.id,
        name: (supaUser.user_metadata as Record<string, unknown> | undefined)?.full_name as string
          ?? supaUser.email
          ?? undefined,
        email: supaUser.email ?? undefined,
        avatarUrl: (supaUser.user_metadata as Record<string, unknown> | undefined)?.avatar_url as string
          ?? undefined,
      };
      setUser(mapped);
      if (session.access_token) saveAuth(session.access_token, mapped);
      const uid = String(mapped.id ?? '');
      if (uid) mergePreloginIntoUser(uid);
    },
    [],
  );

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
        applySession(data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    hydrate();

    if (!isMockAuth && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        applySession(session);
      });
      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [applySession, isMockAuth, supabase]);

  const signIn = useCallback(async (provider: 'google' | 'github' | 'apple', returnTo?: string) => {
    setLoading(true);
    try {
      await clientSignIn(provider, returnTo);
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
        applySession(data.session);
      }
      return state;
    } finally {
      setLoading(false);
    }
  }, [applySession, isMockAuth, supabase]);

  const value = useMemo<Ctx>(
    () => ({ user, loading, signIn, signOut, finishAuth, setUser }),
    [user, loading, signIn, signOut, finishAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
