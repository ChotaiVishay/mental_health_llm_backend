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

export interface ChatReply {
  response: string;
  session_id: string | null;
}

export async function sendMessageToAPI(message: string, sessionId: string | null): Promise<ChatReply> {
  const response = await fetch(CHAT_MESSAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({  message,
      session_id: sessionId,
     }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json() as Promise<ChatReply>;
}