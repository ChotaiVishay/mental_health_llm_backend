// Keeps app code simple even if TS loses track of vite/client ambient types
export type ViteEnv = {
  VITE_AUTH_MOCK?: string;
  VITE_API_BASE_URL?: string;
  VITE_SUPPORTED_LANGS?: string;
  VITE_SERVICES_MOCK?: string; // '1' enables mock services
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_BACKEND_ORIGIN?: string;
  VITE_DJANGO_ADMIN_PATH?: string;
  VITE_ADMIN_AUTH_GOOGLE?: string;
  VITE_ADMIN_AUTH_GITHUB?: string;
  VITE_ADMIN_AUTH_APPLE?: string;
  VITE_SHOW_ADMIN_LINK?: string;
};

type ImportMetaLike = { env?: Record<string, string | undefined> };

// Avoid `any`: cast through `unknown` to a structural type
const meta = (import.meta as unknown as ImportMetaLike) ?? {};
export const VITE: ViteEnv = (meta.env as ViteEnv) ?? {};
