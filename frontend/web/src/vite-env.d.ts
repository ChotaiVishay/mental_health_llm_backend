/// <reference types="vite/client" />

/**
 * Ambient typings for Vite env (global).
 */
interface ImportMetaEnv {
  readonly VITE_AUTH_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CHAT_API_BASE?: string;
  readonly VITE_SUPPORTED_LANGS?: string;
  readonly VITE_SERVICES_MOCK?: string; // '1' to force mock services
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BACKEND_ORIGIN?: string;
  readonly VITE_DJANGO_ADMIN_PATH?: string;
  readonly VITE_ADMIN_AUTH_GOOGLE?: string;
  readonly VITE_ADMIN_AUTH_GITHUB?: string;
  readonly VITE_ADMIN_AUTH_APPLE?: string;
  readonly VITE_SHOW_ADMIN_LINK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
