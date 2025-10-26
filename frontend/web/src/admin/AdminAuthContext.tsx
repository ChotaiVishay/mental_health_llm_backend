import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AdminUser } from '@/types/admin';
import {
  fetchAdminMe,
  loginAdmin,
  logoutAdmin,
  refreshAdmin,
  updateAdminProfile,
  type AdminProfileUpdate,
} from '@/api/admin';

type AuthResult = { ok: boolean; error?: string };

type AdminAuthContextValue = {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  updateProfile: (patch: AdminProfileUpdate) => Promise<AuthResult>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
  initialState?: {
    admin?: AdminUser | null;
    loading?: boolean;
    error?: string | null;
  };
  hydrateOnMount?: boolean;
};

export function AdminAuthProvider({ children, initialState, hydrateOnMount = true }: ProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(initialState?.admin ?? null);
  const [loading, setLoading] = useState<boolean>(initialState?.loading ?? hydrateOnMount);
  const [error, setError] = useState<string | null>(initialState?.error ?? null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fetchAdminMe();
      setAdmin(user);
      setError(null);
    } catch (err) {
      setAdmin(null);
      setError(err instanceof Error ? err.message : 'Failed to load admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrateOnMount) {
      setLoading(false);
      return;
    }
    reload();
  }, [hydrateOnMount, reload]);

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const data = await loginAdmin({ username, password });
      setAdmin(data.user);
      setError(null);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setAdmin(null);
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutAdmin();
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await refreshAdmin();
      setAdmin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session refresh failed');
    }
  }, []);

  const updateProfile = useCallback(async (patch: AdminProfileUpdate): Promise<AuthResult> => {
    try {
      const updated = await updateAdminProfile(patch);
      setAdmin(updated);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => ({
    admin,
    loading,
    error,
    login,
    logout,
    refresh,
    reload,
    updateProfile,
  }), [admin, loading, error, login, logout, refresh, reload, updateProfile]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
