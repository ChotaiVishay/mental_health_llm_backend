// web/src/api/chat.ts
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  // add more fields if your API returns them
}

const CHAT_API_URL = 'http://localhost:8000/chat/chat-sessions/';

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

const CHAT_MESSAGE_URL = 'http://localhost:8000/chat/chat-message/';

export async function sendMessageToAPI(message: string, sessionId: string | null): Promise<ChatReply>;
export async function sendMessageToAPI(payload: ChatRequestPayload): Promise<ChatReply>;
export async function sendMessageToAPI(
  arg1: string | ChatRequestPayload,
  arg2?: string | null,
): Promise<ChatReply> {
  const body: Record<string, unknown> =
    typeof arg1 === 'string'
      ? {
          message: arg1,
          session_id: arg2 ?? null,
        }
      : (() => {
          const { session_id, ...rest } = arg1;
          return {
            session_id: session_id ?? null,
            ...rest,
          };
        })();

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
