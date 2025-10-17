// web/src/api/chat.ts
import { VITE } from '@/utils/env';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormPayload {
  service_name: string;
  organisation_name: string;
  campus_name: string;
  region_name: string;
  service_type: string[];
  delivery_method: string;
  level_of_care: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone?: string;
  email?: string;
  website?: string;
  referral_pathway: string;
  cost: string;
  target_population: string[];
  workforce_type: string;
  notes?: string;
  wait_time?: string;
  expected_wait_time?: string;
  opening_hours_24_7?: boolean;
  opening_hours_standard?: boolean;
  opening_hours_extended?: boolean;
  op_hours_extended_details?: string;
}

export type ChatRequestPayload =
  | { message: string; session_id?: string | null }
  | { type: 'service_form'; data: ServiceFormPayload; session_id?: string | null };

export interface ChatReply {
  response: string;
  session_id: string | null;
  action?: string | null;
}

// Simple: Just one environment variable
const API_BASE_URL = VITE.VITE_API_BASE_URL || 'https://d1hfq1dvtow5bt.cloudfront.net';

const CHAT_ENDPOINT = `${API_BASE_URL}/api/v1/chat/chat`;

export async function fetchChatSessions(): Promise<ChatSession[]> {
  // Not supported in FastAPI version
  return [];
}

export async function sendMessageToAPI(payload: ChatRequestPayload): Promise<ChatReply> {
  const body =
    'type' in payload
      ? { ...payload, session_id: payload.session_id ?? null }
      : { message: payload.message, session_id: payload.session_id ?? null };

  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const raw = (await response.json()) as Record<string, unknown>;
  
  // Backend returns "message", frontend expects "response"
  const text = (raw.message ?? raw.response ?? '') as string;
  
  return {
    response: text,
    session_id: (raw.session_id ?? null) as string | null,
    action: (raw.action ?? null) as string | null,
  };
}
