// web/src/api/chat.ts
import { VITE } from '@/utils/env';

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  last_message: string | null;
  last_message_role: 'user' | 'assistant' | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Get API base URL from environment variable, fallback to CloudFront
const API_BASE_URL =
  VITE.VITE_API_BASE_URL?.trim() ||
  'https://d1hfq1dvtow5bt.cloudfront.net';

// FastAPI endpoints
const CHAT_ENDPOINT = `${API_BASE_URL}/api/v1/chat/chat`;
const SESSIONS_ENDPOINT = `${API_BASE_URL}/api/v1/chat/sessions`;
const CONVERSATION_ENDPOINT = `${API_BASE_URL}/api/v1/chat/conversation`;

function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === null) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    return response.text().then((text) => {
      throw new Error(`HTTP ${response.status} on ${endpoint}: ${text.slice(0, 200)}`);
    });
  }
  return response.json() as Promise<T>;
}

export async function fetchChatSessions(userId: string, limit = 20): Promise<ChatSessionSummary[]> {
  if (!userId?.trim()) return [];

  const url = buildUrl(SESSIONS_ENDPOINT, { user_id: userId, limit });

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    return await handleResponse<ChatSessionSummary[]>(response, url);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

export async function fetchChatConversation(sessionId: string, userId: string, limit = 100): Promise<ChatMessageRecord[]> {
  if (!sessionId?.trim() || !userId?.trim()) return [];

  const endpoint = `${CONVERSATION_ENDPOINT}/${encodeURIComponent(sessionId)}`;
  const url = buildUrl(endpoint, { user_id: userId, limit });

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    return await handleResponse<ChatMessageRecord[]>(response, url);
  } catch (error) {
    console.error('Error fetching chat conversation:', error);
    throw error;
  }
}

/**
 * Service form data structure
 */
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

/**
 * Chat request can be either a message or a service form submission
 */
export type ChatRequestPayload =
  | { message: string; session_id?: string | null }
  | { type: 'service_form'; data: ServiceFormPayload; session_id?: string | null };

/**
 * Chat response from backend
 */
export interface ChatReply {
  response: string;
  session_id: string | null;
  action?: string | null;
  services_found?: number;
  raw_data?: Array<Record<string, unknown>>;
  query_successful?: boolean;
  suggestion?: string;
  /** Original message field for backwards compatibility */
  message?: string;
  /** Optional resources payload provided with crisis_halt responses */
  resources?: unknown;
}

/**
 * Send a message or form to the chat API
 */
export async function sendMessageToAPI(
  payload: ChatRequestPayload | string,
  sessionId?: string | null,
  language?: string,
  userId?: string | null,
): Promise<ChatReply> {
  try {
    // Handle both old signature (message, sessionId) and new signature (payload)
    let body: Record<string, unknown>;
    
    if (typeof payload === 'string') {
      // Old signature: sendMessageToAPI(message, sessionId, language)
      body = {
        message: payload,
        session_id: sessionId ?? null,
      };
      if (language) body.language = language;
      if (userId) body.user_id = userId;
    } else {
      // New signature: sendMessageToAPI(payload)
      body = 'type' in payload
        ? { ...payload, session_id: payload.session_id ?? null }
        : { message: payload.message, session_id: payload.session_id ?? null };
      if (typeof sessionId !== 'undefined' && body.session_id == null) {
        body.session_id = sessionId;
      }
      if (language && !body.language) {
        body.language = language;
      }
      if (userId && !body.user_id) {
        body.user_id = userId;
      }
    }

    console.log('Sending request to:', CHAT_ENDPOINT);
    console.log('Request payload:', JSON.stringify(body, null, 2));

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
      console.error('API error response:', text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const raw = (await response.json()) as Record<string, unknown>;
    console.log('API response:', raw);

    // Backend returns "message", frontend expects "response"
    const text = (raw.message ?? raw.response ?? '') as string;

    return {
      response: text,
      session_id: (raw.session_id ?? null) as string | null,
      action: (raw.action ?? null) as string | null,
      services_found: (raw.services_found ?? 0) as number,
      raw_data: (raw.raw_data ?? []) as Array<Record<string, unknown>>,
      query_successful: (raw.query_successful ?? false) as boolean,
      suggestion: raw.suggestion as string | undefined,
      message: typeof raw.message === 'string' ? raw.message : undefined,
      resources: raw.resources,
    };
  } catch (error) {
    console.error('Error sending message to API:', error);
    throw error;
  }
}

// Export API base URL for debugging
export { API_BASE_URL };
