export type Provider = 'google' | 'apple' | 'github';

export interface User {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}