import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthState, Provider } from './types';
import { getAuth, clearAuth } from './storage';
import { signIn as clientSignIn } from './client';

type Ctx = AuthState & {
  signIn: (provider: Provider, returnTo?: string) => Promise<void>;
  signOut: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ user, token, loading }, set] = useState<AuthState>({ user: null, token: null, loading: true });

  useEffect(() => {
    const { user, token } = getAuth();
    set({ user, token, loading: false });
  }, []);

  const value = useMemo<Ctx>(() => ({
    user, token, loading,
    signIn: async (provider, returnTo) => {
      await clientSignIn(provider, returnTo);
      const { user, token } = getAuth(); // mock flow sets immediately
      set({ user, token, loading: false });
    },
    signOut: () => {
      clearAuth();
      set({ user: null, token: null, loading: false });
    }
  }), [user, token, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}