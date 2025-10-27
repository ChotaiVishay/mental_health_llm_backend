// Keeps app code simple even if TS loses track of vite/client ambient types
export type ViteEnv = {
  VITE_AUTH_MOCK?: string;
  VITE_API_BASE_URL?: string;
  VITE_SUPPORTED_LANGS?: string;
  VITE_SERVICES_MOCK?: string; // '1' enables mock services
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_SERVICE_KEY?: string;
  VITE_BACKEND_ORIGIN?: string;
  VITE_DJANGO_ADMIN_PATH?: string;
  VITE_SUPABASE_STUDIO_URL?: string;
  VITE_ADMIN_PORTAL_URL?: string;
  VITE_ADMIN_AUTH_GOOGLE?: string;
  VITE_ADMIN_AUTH_GITHUB?: string;
  VITE_ADMIN_AUTH_APPLE?: string;
  VITE_SHOW_ADMIN_LINK?: string;
  VITE_APP_BASE_URL?: string;
  VITE_TRANSLATION_API_URL?: string;
};

const metaEnv = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env ?? {};

export const VITE: ViteEnv = metaEnv as ViteEnv;
