import type {
  AdminRole,
  AdminUser,
  Paginated,
  ProviderProfile,
  Service,
  ServiceCategory,
  ServiceSubmission,
  AdminProfile,
} from '@/types/admin';
import { getSupabaseClient } from '@/auth/supabaseClient';
import { getSupabaseAdminClient } from '@/admin/supabaseAdminClient';

type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: AdminRole;
  phone_number: string | null;
  job_title: string | null;
  organisation: string | null;
  notes: string | null;
  is_active: boolean;
  last_login: string | null;
  last_sign_in_at: string | null;
  date_joined: string;
  created_at: string;
  updated_at: string;
};

type ProviderRow = {
  id: string;
  display_name: string;
  contact_email: string | null;
  phone_number: string | null;
  website: string | null;
  description: string | null;
  address: string | null;
  status: ProviderProfile['status'];
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user: null | {
    id: string;
    username: string;
    email: string;
    role: AdminRole;
    first_name: string | null;
    last_name: string | null;
  };
};

type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string;
  status: Service['status'];
  approval_notes: string | null;
  provider_id: string | null;
  category_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  provider: ProviderRow | null;
  category: ServiceCategory | null;
};

type ServiceSubmissionRow = {
  id: string;
  session_id: string | null;
  submitted_at: string;
  service_name: string;
  organisation_name: string;
  campus_name: string;
  region_name: string;
  service_type: string | string[] | null;
  delivery_method: string;
  level_of_care: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  referral_pathway: string;
  cost: string;
  target_population: string | string[] | null;
  expected_wait_time: string | null;
  notes: string | null;
  opening_hours_24_7: boolean | null;
  opening_hours_standard: boolean | null;
  opening_hours_extended: boolean | null;
  op_hours_extended_details: string | null;
};

type PaginationParams = {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
  category?: string;
};

function requireClient() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client is not configured.');
  return supabase;
}

function requireAdminClient() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error('Supabase service client is not configured.');
  return supabase;
}

function slugify(input: unknown, fallback = 'service'): string {
  const text = typeof input === 'string' ? input : '';
  const base = text.trim() || fallback;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || fallback;
}

function splitCSVValues(input: string | string[] | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean);
  return String(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 't', 'y', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return false;
}

async function syncLegacyServiceRow(service: Service): Promise<void> {
  try {
    const adminClient = requireAdminClient();
    const { error } = await adminClient
      .from('service')
      .upsert(
        {
          service_key: service.id,
          organisation_key: service.provider?.id ?? null,
          service_name: service.name,
        },
        { onConflict: 'service_key' },
      );
    if (error) throw error;
  } catch (err) {
    console.warn('Failed to sync legacy service row', err);
  }
}

function mapAdmin(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    is_active: row.is_active,
    date_joined: row.date_joined,
    last_login: row.last_login,
    last_sign_in_at: row.last_sign_in_at,
    profile: {
      role: row.role,
      phone_number: row.phone_number,
      job_title: row.job_title,
      organisation: row.organisation,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  };
}

function mapServiceSubmission(row: ServiceSubmissionRow): ServiceSubmission {
  return {
    id: row.id,
    session_id: row.session_id,
    submitted_at: row.submitted_at,
    service_name: row.service_name,
    organisation_name: row.organisation_name,
    campus_name: row.campus_name,
    region_name: row.region_name,
    service_types: splitCSVValues(row.service_type),
    delivery_method: row.delivery_method,
    level_of_care: row.level_of_care,
    address: row.address,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    phone: row.phone,
    email: row.email,
    website: row.website,
    referral_pathway: row.referral_pathway,
    cost: row.cost,
    target_populations: splitCSVValues(row.target_population),
    expected_wait_time: row.expected_wait_time,
    notes: row.notes,
    opening_hours_24_7: toBoolean(row.opening_hours_24_7),
    opening_hours_standard: toBoolean(row.opening_hours_standard),
    opening_hours_extended: toBoolean(row.opening_hours_extended),
    op_hours_extended_details: row.op_hours_extended_details,
  };
}

async function fetchAdminById(id: string): Promise<AdminUser> {
  const client = requireClient();
  const { data, error } = await client
    .from('admin_users_view')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Admin user not found.');
  return mapAdmin(data as AdminUserRow);
}

async function fetchProviderById(id: string): Promise<ProviderProfile> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('provider_profiles_view')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Provider not found.');
  return {
    ...(data as ProviderRow),
  };
}

async function fetchServiceById(id: string): Promise<Service> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('services_view')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Service not found.');
  return {
    ...(data as ServiceRow),
    provider: (data as ServiceRow).provider
      ? {
          ...(data as ServiceRow).provider!,
        }
      : null,
    category: (data as ServiceRow).category,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id ?? null;
}

export type AdminProfileUpdate = Partial<Omit<AdminUser, 'profile'>> & {
  profile?: Partial<AdminProfile>;
};

export type LoginPayload = { username: string; password: string };
export type LoginResponse = { user: AdminUser };

export async function loginAdmin(payload: LoginPayload): Promise<LoginResponse> {
  const supabase = requireClient();
  const identifier = payload.username.trim();
  if (!identifier) throw new Error('Email or username is required.');

  let email = identifier;
  if (!identifier.includes('@')) {
    const adminClient = requireAdminClient();
    const { data, error } = await adminClient
      .from('admin_profiles')
      .select('email')
      .eq('username', identifier)
      .single();
    if (error || !data) throw new Error('Unknown administrator username.');
    email = (data as { email: string }).email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) throw new Error(error.message);
  if (!data.session?.user?.id) throw new Error('Invalid Supabase response.');

  const user = await fetchAdminById(data.session.user.id);
  if (!['moderator', 'admin', 'super_admin'].includes(user.profile.role)) {
    await supabase.auth.signOut();
    throw new Error('This account does not have administrator permissions.');
  }

  return { user };
}

export async function refreshAdmin(): Promise<LoginResponse> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('No active admin session.');
  const user = await fetchAdminById(userId);
  return { user };
}

export async function logoutAdmin(): Promise<void> {
  const supabase = requireClient();
  await supabase.auth.signOut();
}

export async function fetchAdminMe(): Promise<AdminUser> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in.');
  return fetchAdminById(id);
}

export async function updateAdminProfile(patch: AdminProfileUpdate): Promise<AdminUser> {
  const supabase = requireClient();
  const { data: session } = await supabase.auth.getSession();
  const id = session.session?.user?.id;
  if (!id) throw new Error('Not signed in.');

  const adminClient = requireAdminClient();
  const profileUpdate: Record<string, unknown> = {};
  if (typeof patch.username === 'string') profileUpdate.username = patch.username;
  if (typeof patch.email === 'string') profileUpdate.email = patch.email;
  if (typeof patch.first_name === 'string') profileUpdate.first_name = patch.first_name;
  if (typeof patch.last_name === 'string') profileUpdate.last_name = patch.last_name;
  if (patch.profile?.role) profileUpdate.role = patch.profile.role;
  if (patch.profile?.phone_number !== undefined) profileUpdate.phone_number = patch.profile.phone_number;
  if (patch.profile?.job_title !== undefined) profileUpdate.job_title = patch.profile.job_title;
  if (patch.profile?.organisation !== undefined) profileUpdate.organisation = patch.profile.organisation;
  if (patch.profile?.notes !== undefined) profileUpdate.notes = patch.profile.notes;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await adminClient
      .from('admin_profiles')
      .update(profileUpdate)
      .eq('user_id', id);
    if (error) throw new Error(error.message);
  }

  if (patch.email || patch.first_name || patch.last_name) {
    const { error: userError } = await supabase.auth.updateUser({
      email: patch.email,
      data: {
        first_name: patch.first_name,
        last_name: patch.last_name,
        username: patch.username,
      },
    });
    if (userError) throw new Error(userError.message);
  }

  return fetchAdminById(id);
}

function buildPagination(params: PaginationParams) {
  const pageSize = Math.max(1, params.page_size ?? 25);
  const page = Math.max(1, params.page ?? 1);
  return {
    page,
    pageSize,
    rangeStart: (page - 1) * pageSize,
    rangeEnd: (page - 1) * pageSize + (pageSize - 1),
  };
}

export async function listUsers(params: PaginationParams = {}): Promise<Paginated<AdminUser>> {
  const supabase = requireClient();
  const { rangeStart, rangeEnd, page } = buildPagination(params);
  let query = supabase
    .from('admin_users_view')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeEnd);

  if (params.search) {
    const term = `%${params.search}%`;
    query = query.or(`username.ilike.${term},email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const results = ((data ?? []) as AdminUserRow[]).map(mapAdmin);

  const total = count ?? results.length;
  return {
    count: total,
    results,
    previous: page > 1 ? String(page - 1) : null,
    next: rangeEnd + 1 < total ? String(page + 1) : null,
  };
}

type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: AdminRole;
};

type UpdateUserPayload = Partial<CreateUserPayload> & { is_active?: boolean };

export async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  const adminClient = requireAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      username: payload.username,
      first_name: payload.first_name,
      last_name: payload.last_name,
    },
  });
  if (error || !data.user?.id) throw new Error(error?.message ?? 'Failed to create admin user.');

  const { error: profileError } = await adminClient
    .from('admin_profiles')
    .update({
      username: payload.username,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: payload.role,
      is_active: true,
    })
    .eq('user_id', data.user.id);
  if (profileError) throw new Error(profileError.message);

  return fetchAdminById(data.user.id);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUser> {
  const adminClient = requireAdminClient();

  const metadata: Record<string, unknown> = {};
  if (payload.first_name !== undefined) metadata.first_name = payload.first_name;
  if (payload.last_name !== undefined) metadata.last_name = payload.last_name;
  if (payload.username !== undefined) metadata.username = payload.username;

  if (payload.email || Object.keys(metadata).length > 0) {
    const { error } = await adminClient.auth.admin.updateUserById(id, {
      email: payload.email,
      user_metadata: metadata,
    });
    if (error) throw new Error(error.message);
  }

  const profileUpdate: Record<string, unknown> = {};
  if (payload.username !== undefined) profileUpdate.username = payload.username;
  if (payload.email !== undefined) profileUpdate.email = payload.email;
  if (payload.first_name !== undefined) profileUpdate.first_name = payload.first_name;
  if (payload.last_name !== undefined) profileUpdate.last_name = payload.last_name;
  if (payload.role !== undefined) profileUpdate.role = payload.role;
  if (payload.is_active !== undefined) profileUpdate.is_active = payload.is_active;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await adminClient
      .from('admin_profiles')
      .update(profileUpdate)
      .eq('user_id', id);
    if (error) throw new Error(error.message);
  }

  return fetchAdminById(id);
}

export async function deleteUser(id: string): Promise<void> {
  const adminClient = requireAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
}

export async function listAdmins(params: PaginationParams = {}): Promise<Paginated<AdminUser>> {
  const result = await listUsers(params);
  return {
    ...result,
    results: result.results.filter((user) => ['moderator', 'admin', 'super_admin'].includes(user.profile.role)),
  };
}

export async function createAdminAccount(payload: CreateUserPayload): Promise<AdminUser> {
  return createUser(payload);
}

export async function updateAdminAccount(id: string, payload: UpdateUserPayload): Promise<AdminUser> {
  return updateUser(id, payload);
}

export async function deleteAdminAccount(id: string): Promise<void> {
  await deleteUser(id);
}

export async function listProviders(params: PaginationParams = {}): Promise<Paginated<ProviderProfile>> {
  const supabase = requireClient();
  const { rangeStart, rangeEnd, page } = buildPagination(params);
  let query = supabase
    .from('provider_profiles_view')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeEnd);

  if (params.search) {
    const term = `%${params.search}%`;
    query = query.or(`display_name.ilike.${term},contact_email.ilike.${term},description.ilike.${term}`);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const results: ProviderProfile[] = ((data ?? []) as ProviderRow[]).map((row) => ({
    id: row.id,
    user: row.user,
    display_name: row.display_name,
    contact_email: row.contact_email,
    phone_number: row.phone_number,
    website: row.website,
    description: row.description,
    address: row.address,
    status: row.status,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const total = count ?? results.length;
  return {
    count: total,
    results,
    previous: page > 1 ? String(page - 1) : null,
    next: rangeEnd + 1 < total ? String(page + 1) : null,
  };
}

export async function createProvider(payload: Record<string, unknown>): Promise<ProviderProfile> {
  const supabase = requireClient();
  const reviewer = await getCurrentUserId();
  const insertPayload = {
    ...payload,
    reviewed_by: reviewer,
    reviewed_at: reviewer ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from('provider_profiles')
    .insert(insertPayload)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create provider.');
  return fetchProviderById(data.id);
}

export async function updateProvider(id: string, payload: Record<string, unknown>): Promise<ProviderProfile> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('provider_profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update provider.');
  return fetchProviderById(data.id);
}

export async function deleteProvider(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('provider_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setProviderStatus(
  id: string,
  status: ProviderProfile['status'],
  notes?: string,
): Promise<ProviderProfile> {
  const supabase = requireClient();
  const reviewer = await getCurrentUserId();
  const payload: Record<string, unknown> = {
    status,
    reviewed_by: reviewer,
    reviewed_at: reviewer ? new Date().toISOString() : null,
  };
  if (notes !== undefined) payload.description = notes;
  const { data, error } = await supabase
    .from('provider_profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update provider status.');
  return fetchProviderById(data.id);
}

export async function listServices(params: PaginationParams = {}): Promise<Paginated<Service>> {
  const supabase = requireClient();
  const { rangeStart, rangeEnd, page } = buildPagination(params);
  let query = supabase
    .from('services_view')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(rangeStart, rangeEnd);

  if (params.search) {
    const term = `%${params.search}%`;
    query = query.or(`name.ilike.${term},summary.ilike.${term},description.ilike.${term}`);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.category) {
    query = query.eq('category_id', params.category);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const results: Service[] = ((data ?? []) as ServiceRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    status: row.status,
    approval_notes: row.approval_notes,
    provider_id: row.provider_id,
    category_id: row.category_id,
    provider: row.provider
      ? {
          id: row.provider.id,
          user: row.provider.user,
          display_name: row.provider.display_name,
          contact_email: row.provider.contact_email,
          phone_number: row.provider.phone_number,
          website: row.provider.website,
          description: row.provider.description,
          address: row.provider.address,
          status: row.provider.status,
          reviewed_by: row.provider.reviewed_by,
          reviewed_at: row.provider.reviewed_at,
          created_at: row.provider.created_at,
          updated_at: row.provider.updated_at,
        }
      : null,
    category: row.category,
    created_by: row.created_by,
    updated_by: row.updated_by,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const total = count ?? results.length;
  return {
    count: total,
    results,
    previous: page > 1 ? String(page - 1) : null,
    next: rangeEnd + 1 < total ? String(page + 1) : null,
  };
}

export async function createService(payload: Record<string, unknown>): Promise<Service> {
  const supabase = requireClient();
  const actor = await getCurrentUserId();
  const insertPayload = {
    ...payload,
    slug: slugify(payload?.name),
    created_by: actor,
    updated_by: actor,
  };
  const { data, error } = await supabase
    .from('services')
    .insert(insertPayload)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create service.');
  const service = await fetchServiceById(data.id);
  await syncLegacyServiceRow(service);
  return service;
}

export async function updateService(id: string, payload: Record<string, unknown>): Promise<Service> {
  const supabase = requireClient();
  const actor = await getCurrentUserId();
  const { data, error } = await supabase
    .from('services')
    .update({
      ...payload,
      updated_by: actor,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update service.');
  const service = await fetchServiceById(data.id);
  await syncLegacyServiceRow(service);
  return service;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
  try {
    const adminClient = requireAdminClient();
    await adminClient.from('service').delete().eq('service_key', id);
  } catch (err) {
    console.warn('Failed to remove legacy service row', err);
  }
}

export async function setServiceStatus(
  id: string,
  status: Service['status'],
  approval_notes?: string,
): Promise<Service> {
  const supabase = requireClient();
  const actor = await getCurrentUserId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('services')
    .update({
      status,
      approval_notes,
      approved_by: actor,
      approved_at: actor ? now : null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update service status.');
  return fetchServiceById(data.id);
}

export async function listServiceSubmissionRequests(): Promise<ServiceSubmission[]> {
  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from('service_submission_requests')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data as ServiceSubmissionRow[] | null) ?? [];
  return rows.map(mapServiceSubmission);
}

export async function deleteServiceSubmissionRequest(id: string): Promise<void> {
  const supabase = requireAdminClient();
  const { error } = await supabase
    .from('service_submission_requests')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ServiceCategory[] | null) ?? [];
}

export async function createServiceCategory(payload: Record<string, unknown>): Promise<ServiceCategory> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('service_categories')
    .insert(payload)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create service category.');
  return data as ServiceCategory;
}

export async function updateServiceCategory(id: string, payload: Record<string, unknown>): Promise<ServiceCategory> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('service_categories')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update service category.');
  return data as ServiceCategory;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('service_categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
