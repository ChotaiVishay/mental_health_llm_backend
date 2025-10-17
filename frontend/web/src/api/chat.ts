// web/src/api/chat.ts
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const envBase =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_CHAT_API_BASE
    : undefined;

const DEFAULT_BASE = 'https://mental-health-prod-v2.eba-cxhtfs2h.us-east-1.elasticbeanstalk.com';
const RAW_BASE = (envBase && envBase.trim()) || DEFAULT_BASE;
const BASE = RAW_BASE.replace(/\/+$/, '');

function join(base: string, path: string) {
  return `${base}/${path.replace(/^\/+/, '')}`;
}

const LOOKS_LIKE_FASTAPI = /\/api\/v\d+\/chat$/i.test(BASE);
const CHAT_SESSIONS_URL = join(BASE, LOOKS_LIKE_FASTAPI ? 'sessions/' : 'chat/chat-sessions/');
const CHAT_MESSAGE_URL = join(BASE, LOOKS_LIKE_FASTAPI ? 'chat' : 'chat/chat-message/');
const CHAT_SESSIONS_SUPPORTED = !LOOKS_LIKE_FASTAPI;


export async function fetchChatSessions(): Promise<ChatSession[]> {
  if (!CHAT_SESSIONS_SUPPORTED) return [];

  const response = await fetch(CHAT_SESSIONS_URL, {
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return [];

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} on ${CHAT_SESSIONS_URL}: ${text.slice(0, 120)}`);
  }

  const data = await response.json();
  return data as ChatSession[];
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

export async function sendMessageToAPI(payload: ChatRequestPayload): Promise<ChatReply> {
  const body =
    'type' in payload
      ? { ...payload, session_id: payload.session_id ?? null }
      : { message: payload.message, session_id: payload.session_id ?? null };

  const response = await fetch(CHAT_MESSAGE_URL, {
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
  const text = (raw.response ?? raw.message ?? '') as string;

  return {
    response: text,
    session_id: (raw.session_id ?? null) as string | null,
    action: (raw.action ?? null) as string | null,
  };
}
