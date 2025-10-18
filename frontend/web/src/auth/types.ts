export type Provider = 'google' | 'apple' | 'github';

export interface User {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  // Optional RBAC fields populated from Supabase profile/app_metadata
  role?: 'superadmin' | 'admin' | 'org_admin' | 'editor' | 'viewer';
  roles?: string[];
  org_id?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
