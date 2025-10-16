// web/src/api/chat.ts
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  // add more fields if your API returns them
}

const BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CHAT_API_BASE) ||
  'http://mental-health-prod-v2.eba-cxhtfs2h.us-east-1.elasticbeanstalk.com';

const CHAT_API_URL = `${BASE.replace(/\/$/, '')}/chat/chat-sessions/`;
const CHAT_MESSAGE_URL = `${BASE.replace(/\/$/, '')}/chat/chat-message/`;


export async function fetchChatSessions(): Promise<ChatSession[]> {
  const response = await fetch(CHAT_API_URL, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} on ${CHAT_API_URL}: ${text.slice(0, 120)}`);
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

export async function sendMessageToAPI(message: string, sessionId: string | null): Promise<ChatReply> {
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

  return response.json() as Promise<ChatReply>;
}
