export type Provider = 'google' | 'apple' | 'github';

export interface User {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  timezone?: string;
  prefWeeklyDigest?: boolean;
  prefProductUpdates?: boolean;
  prefShareAnonymisedData?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
