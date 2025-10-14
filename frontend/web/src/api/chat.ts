// web/src/api/chat.ts
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  // add more fields if your API returns them
}

// const CHAT_API_URL = 'http://localhost:8000/chat/chat-sessions/';
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').toString().replace(/\/+$/,'');
const CHAT_API_URL = `${API_BASE}/chat/chat-sessions/`;
const MESSAGE_API_URL = `${API_BASE}/chat/send-message/`;

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

const CHAT_MESSAGE_URL = `${API_BASE}/chat/send-message/`;

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