/// <reference types="vite/client" />

/**
 * Ambient typings for Vite env (global).
 */
interface ImportMetaEnv {
  readonly VITE_AUTH_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPPORTED_LANGS?: string;
  readonly VITE_SERVICES_MOCK?: string; // '1' to force mock services
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}