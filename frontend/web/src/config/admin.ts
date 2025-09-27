// Centralised helpers for Django Admin URLs used by the frontend.
// All values are read from Vite envs so we can swap per environment.

function trimTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}
function ensureLeadingSlash(s: string) {
  return s.startsWith('/') ? s : `/${s}`;
}
function join(origin: string, path: string) {
  return `${trimTrailingSlash(origin)}${ensureLeadingSlash(path)}`;
}

const BACKEND_ORIGIN = (import.meta.env.VITE_BACKEND_ORIGIN ?? '').toString();
const DJANGO_ADMIN_PATH = (import.meta.env.VITE_DJANGO_ADMIN_PATH ?? '/admin/').toString();

export const ADMIN_CONSOLE_URL = BACKEND_ORIGIN
  ? join(BACKEND_ORIGIN, DJANGO_ADMIN_PATH)
  : '/admin/'; // sensible placeholder in dev if origin missing

// Optional social auth start endpoints on the backend (Django side)
const OAUTH_PATHS = {
  google: import.meta.env.VITE_ADMIN_AUTH_GOOGLE?.toString(),
  github: import.meta.env.VITE_ADMIN_AUTH_GITHUB?.toString(),
  apple: import.meta.env.VITE_ADMIN_AUTH_APPLE?.toString(),
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
  const next = encodeURIComponent(ADMIN_CONSOLE_URL);
  return `${startUrl}${sep}next=${next}`;
}

/** Optional: turn on Admin link in header via env */
export const SHOW_ADMIN_LINK =
  String(import.meta.env.VITE_SHOW_ADMIN_LINK ?? '') === '1';