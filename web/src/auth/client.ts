import type { Provider, User } from './types';
import { saveAuth } from './storage';

const isMock = import.meta.env.VITE_AUTH_MOCK === '1';

export async function signIn(provider: Provider, returnTo?: string) {
  if (isMock) {
    // Simulate login locally
    const token = 'dev-token';
    const user: User = { id: 'dev1', name: 'Dev User', email: 'dev@example.com' };
    saveAuth(token, user);
    if (returnTo) sessionStorage.setItem('sa_return_to', returnTo);
    return { ok: true as const, redirected: false };
  }
  // Real OAuth kick-off via backend
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const redirect = `${window.location.origin}/auth/callback`;
  const url = `${base}/api/auth/${provider}?redirect_uri=${encodeURIComponent(redirect)}${
    returnTo ? `&state=${encodeURIComponent(returnTo)}` : ''
  }`;
  window.location.href = url;
  return { ok: true as const, redirected: true };
}

export function parseCallbackAndStore() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token') ?? 'dev-token';
  const name = url.searchParams.get('name') ?? 'Authenticated User';
  const email = url.searchParams.get('email') ?? undefined;
  const user: User = { id: 'u1', name, email };
  saveAuth(token, user);

  const state = url.searchParams.get('state') ?? sessionStorage.getItem('sa_return_to') ?? '/';
  sessionStorage.removeItem('sa_return_to');
  return state;
}