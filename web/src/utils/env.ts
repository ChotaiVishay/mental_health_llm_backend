// Central, typed access to Vite env.
// This keeps app code simple even if TS loses track of vite types in one project build.
type ViteEnv = {
  VITE_AUTH_MOCK?: string;
  VITE_API_BASE_URL?: string;
  VITE_SUPPORTED_LANGS?: string;
};

export const VITE = ((import.meta as any).env ?? {}) as ViteEnv;