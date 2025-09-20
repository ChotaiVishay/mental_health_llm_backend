// web/src/auth/AuthContext.tsx
import React, {
  createContext, useContext, useMemo, useState, useCallback, type ReactNode,
} from 'react';
import type { User } from './types';
import { getAuth, clearAuth } from './storage';
import { signIn as clientSignIn } from './client';
import { mergePreloginIntoUser } from '@/features/chat/sessionStore';

type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: (provider: 'google' | 'github' | 'apple', returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  finishAuth: () => Promise<void>;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>; // handy for tests
};

const AuthContext = createContext<Ctx>({
  user: null,
  loading: false,
  // safe no-ops as defaults
  async signIn() {},
  async signOut() {},
  async finishAuth() {},
});

type AuthProviderProps = {
  children: ReactNode;
  initialState?: { user?: User | null; loading?: boolean };
};

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialState?.user ?? null);
  const [loading, setLoading] = useState<boolean>(initialState?.loading ?? false);

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
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Called after OAuth callback: hydrate user & merge pre-login chat */
  const finishAuth = useCallback(async () => {
    setLoading(true);
    try {
      const { user: stored } = getAuth();
      if (stored) {
        setUser(stored as User);
        const uid = String((stored as User).id ?? '');
        if (uid) mergePreloginIntoUser(uid);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ user, loading, signIn, signOut, finishAuth, setUser }),
    [user, loading, signIn, signOut, finishAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }