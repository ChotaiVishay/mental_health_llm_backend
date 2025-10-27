import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from './types';

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y', 'on', 'enabled'].includes(value.trim().toLowerCase());
  }
  return false;
}

export function mapSupabaseUser(u: SupabaseUser): User {
  const metadata = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name = (metadata.full_name as string | undefined) ?? u.email ?? undefined;

  return {
    id: u.id,
    name,
    email: u.email ?? undefined,
    avatarUrl: (metadata.avatar_url as string | undefined) ?? undefined,
    phoneNumber: (metadata.phone_number as string | undefined) ?? undefined,
    timezone: (metadata.timezone as string | undefined) ?? undefined,
    prefWeeklyDigest: toBoolean(metadata.pref_weekly_digest),
    prefProductUpdates: toBoolean(metadata.pref_product_updates),
    prefShareAnonymisedData: toBoolean(metadata.pref_share_anonymised),
  };
}
