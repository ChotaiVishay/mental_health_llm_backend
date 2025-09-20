// Keeps app code simple even if TS loses track of vite/client ambient types
export type ViteEnv = {
  VITE_AUTH_MOCK?: string;
  VITE_API_BASE_URL?: string;
  VITE_SUPPORTED_LANGS?: string;
  VITE_SERVICES_MOCK?: string; // '1' enables mock services
};

type ImportMetaLike = { env?: Record<string, string | undefined> };

// Avoid `any`: cast through `unknown` to a structural type
const meta = (import.meta as unknown as ImportMetaLike) ?? {};
export const VITE: ViteEnv = (meta.env as ViteEnv) ?? {};