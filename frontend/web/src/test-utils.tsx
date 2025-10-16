import { ReactNode } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import type { User } from './auth/types';

type ProvidersProps = {
  children: ReactNode;
  router?: Partial<MemoryRouterProps>;
  /** If you pass a user, we simulate logged-in state via localStorage */
  auth?: { user?: User | null };
};

/**
 * Test wrapper that provides:
 *  - MemoryRouter (so you can set initialEntries)
 *  - AuthProvider (so useAuth() works)
 *  - Optional "logged-in" state by seeding localStorage keys
 */
export function Providers({ children, router, auth }: ProvidersProps) {
  const initialEntries = router?.initialEntries ?? ['/'];

  // Normalise auth state into storage so AuthProvider picks it up
  if (auth?.user) {
    localStorage.setItem('sa_token', 'test-token');
    localStorage.setItem('sa_user', JSON.stringify(auth.user));
  } else {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
  }

  return (
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </AuthProvider>
  );
}
