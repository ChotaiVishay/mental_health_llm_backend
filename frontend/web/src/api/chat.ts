// web/src/api/chat.ts

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').toString().replace(/\/+$/,'');

// Chat endpoint
const CHAT_ENDPOINT = `${API_BASE}/api/v1/chat/chat`;

// Interfaces
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatReply {
  response: string;
  session_id: string | null;
}

// Fetch chat sessions - NOTE: Backend endpoint doesn't exist yet
export async function fetchChatSessions(): Promise<ChatSession[]> {
  console.warn('fetchChatSessions: Backend endpoint not implemented yet');
  // Return empty array for now since backend doesn't have this endpoint
  return [];
  
  // Uncomment this when adding the backend endpoint:
  /*
  const url = `${API_BASE}/api/v1/chat/sessions`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json() as Promise<ChatSession[]>;
  */
}

// Send message to chat
export async function sendMessageToAPI(message: string, sessionId: string | null): Promise<ChatReply> {
  console.log('Sending to:', CHAT_ENDPOINT);
  
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ 
      message,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json() as Promise<ChatReply>;
}