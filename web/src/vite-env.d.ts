/// <reference types="vite/client" />

// Project-specific keys
interface ImportMetaEnv {
  readonly VITE_AUTH_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPPORTED_LANGS?: string;
}

// Ensure `import.meta.env` exists
interface ImportMeta {
  readonly env: ImportMetaEnv;
}