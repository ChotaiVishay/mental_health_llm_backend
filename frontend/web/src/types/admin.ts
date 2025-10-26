export type AdminRole = 'user' | 'provider' | 'moderator' | 'admin' | 'super_admin';

export type AdminProfile = {
  role: AdminRole;
  phone_number?: string | null;
  job_title?: string | null;
  organisation?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string | null;
  last_sign_in_at?: string | null;
  profile: AdminProfile;
};

export type ProviderProfileUser = {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  first_name?: string | null;
  last_name?: string | null;
};

export type ProviderProfile = {
  id: string;
  user: ProviderProfileUser | null;
  display_name: string;
  contact_email?: string | null;
  phone_number?: string | null;
  website?: string | null;
  description?: string | null;
  address?: string | null;
  status: 'pending' | 'approved' | 'disabled' | 'rejected';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'disabled' | 'rejected';
  approval_notes?: string | null;
  provider_id?: string | null;
  category_id?: string | null;
  provider: ProviderProfile | null;
  category: ServiceCategory | null;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceSubmission = {
  id: string;
  session_id?: string | null;
  submitted_at: string;
  service_name: string;
  organisation_name: string;
  campus_name: string;
  region_name: string;
  service_types: string[];
  delivery_method: string;
  level_of_care: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  referral_pathway: string;
  cost: string;
  target_populations: string[];
  expected_wait_time?: string | null;
  notes?: string | null;
  opening_hours_24_7: boolean;
  opening_hours_standard: boolean;
  opening_hours_extended: boolean;
  op_hours_extended_details?: string | null;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
