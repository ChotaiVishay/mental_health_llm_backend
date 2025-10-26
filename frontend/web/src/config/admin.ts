// Centralised helpers for Django Admin URLs used by the frontend.
// All values are read from Vite envs so we can swap per environment.
import { VITE } from '@/utils/env';

function trimTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}
function ensureLeadingSlash(s: string) {
  return s.startsWith('/') ? s : `/${s}`;
}
function join(origin: string, path: string) {
  return `${trimTrailingSlash(origin)}${ensureLeadingSlash(path)}`;
}

const BACKEND_ORIGIN = (VITE.VITE_BACKEND_ORIGIN ?? '').toString();
const DJANGO_ADMIN_PATH = (VITE.VITE_DJANGO_ADMIN_PATH ?? '/admin/').toString();

const SUPABASE_STUDIO_URL = (VITE.VITE_SUPABASE_STUDIO_URL ?? '').toString();
const EXPLICIT_PORTAL_URL = (VITE.VITE_ADMIN_PORTAL_URL ?? '').toString();

/**
 * Resolve the admin portal URL. Preference order:
 *  1. An explicit `VITE_ADMIN_PORTAL_URL`
 *  2. Supabase Studio URL (useful when managing auth/users directly)
 *  3. Legacy Django admin path (still works in hybrid deployments)
 */
export const ADMIN_PORTAL_URL =
  EXPLICIT_PORTAL_URL ||
  SUPABASE_STUDIO_URL ||
  (BACKEND_ORIGIN ? join(BACKEND_ORIGIN, DJANGO_ADMIN_PATH) : '/admin/');

// Backwards compatibility: some imports still expect ADMIN_CONSOLE_URL
export const ADMIN_CONSOLE_URL = ADMIN_PORTAL_URL;

// Optional social auth start endpoints on the backend (legacy Django side)
const OAUTH_PATHS = {
  google: VITE.VITE_ADMIN_AUTH_GOOGLE?.toString(),
  github: VITE.VITE_ADMIN_AUTH_GITHUB?.toString(),
  apple: VITE.VITE_ADMIN_AUTH_APPLE?.toString(),
} as const;

export type AdminProvider = keyof typeof OAUTH_PATHS;

/**
 * Build a full absolute OAuth start URL on the backend with ?next=<admin console>.
 * Returns null if the provider path isn’t configured.
 */
export function getAdminOAuthUrl(provider: AdminProvider): string | null {
  const path = OAUTH_PATHS[provider];
  if (!path || !BACKEND_ORIGIN) return null;

  const startUrl = join(BACKEND_ORIGIN, path);
  const sep = startUrl.includes('?') ? '&' : '?';
  const next = encodeURIComponent(ADMIN_PORTAL_URL);
  return `${startUrl}${sep}next=${next}`;
}

/** Optional: turn on Admin link in header via env */
export const SHOW_ADMIN_LINK = String(VITE.VITE_SHOW_ADMIN_LINK ?? '') === '1';
