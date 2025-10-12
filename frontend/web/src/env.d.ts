/// <reference types="vite/client" />

/**
 * Ambient typings for Vite env (global).
 */
interface ImportMetaEnv {
  readonly VITE_AUTH_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}