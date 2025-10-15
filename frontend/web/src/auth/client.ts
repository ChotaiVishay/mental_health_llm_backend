import type { Provider, User } from './types';
import { saveAuth, setReturnTo } from './storage';
import { VITE } from '@/utils/env';
import { getSupabaseClient } from './supabaseClient';

const supabase = getSupabaseClient();
const isMock = VITE.VITE_AUTH_MOCK === '1' || !supabase;

export async function signIn(provider: Provider, returnTo?: string) {
  if (isMock) {
    const token = 'dev-token';
    const user: User = { id: 'dev1', name: 'Dev User', email: 'dev@example.com' };
    saveAuth(token, user);
    if (returnTo) setReturnTo(returnTo);
    return { ok: true as const, redirected: false };
  }
  if (returnTo) setReturnTo(returnTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
    return { ok: true as const, redirected: true };
  }
  return { ok: true as const, redirected: false };
}

export async function parseCallbackAndStore(): Promise<string | undefined> {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const state = url.searchParams.get('state') ?? hashParams.get('state') ?? undefined;

  if (isMock) {
    const token = url.searchParams.get('token') ?? 'dev-token';
    const name = url.searchParams.get('name') ?? 'Authenticated User';
    const email = url.searchParams.get('email') ?? undefined;
    const user: User = { id: 'u1', name, email };
    saveAuth(token, user);
    return state;
  }

  const client = getSupabaseClient();
  if (client) {
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
    } else if (url.searchParams.has('code')) {
      const { error } = await client.auth.exchangeCodeForSession(url.toString());
      if (error) throw error;
    }
  }

  if (url.hash) {
    window.history.replaceState(null, '', `${url.origin}${url.pathname}${url.search}`);
  }

  return state;
}
