import { getSupabaseClient } from '@/auth/supabaseClient';

export type AgreementStatus = {
  termsVersion: string;
  privacyVersion: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  requiresAcceptance: boolean;
};

export const AGREEMENT_TERMS_VERSION = '2025-02-17';
export const AGREEMENT_PRIVACY_VERSION = '2025-02-17';

function baseStatus(overrides: Partial<AgreementStatus>): AgreementStatus {
  return {
    termsVersion: AGREEMENT_TERMS_VERSION,
    privacyVersion: AGREEMENT_PRIVACY_VERSION,
    termsAccepted: false,
    privacyAccepted: false,
    requiresAcceptance: true,
    ...overrides,
  };
}

export async function fetchAgreementStatus(userId?: string | null): Promise<AgreementStatus> {
  if (!userId) {
    return baseStatus({});
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('legal_acceptances')
    .select('terms_version, privacy_version, accepted_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load agreement status');
  }

  if (!data) {
    return baseStatus({});
  }

  const termsAccepted = data.terms_version === AGREEMENT_TERMS_VERSION;
  const privacyAccepted = data.privacy_version === AGREEMENT_PRIVACY_VERSION;

  return baseStatus({
    termsAccepted,
    privacyAccepted,
    requiresAcceptance: !(termsAccepted && privacyAccepted),
  });
}

export async function acceptAgreements(userId: string): Promise<AgreementStatus> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const payload = {
    user_id: userId,
    terms_version: AGREEMENT_TERMS_VERSION,
    privacy_version: AGREEMENT_PRIVACY_VERSION,
    accepted_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('legal_acceptances')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw new Error(error.message || 'Failed to save agreement acceptance');
  }

  return baseStatus({
    termsAccepted: true,
    privacyAccepted: true,
    requiresAcceptance: false,
  });
}
