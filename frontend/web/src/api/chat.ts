// web/src/api/chat.ts
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').toString().replace(/\/+$/,'');

// updated endpoint
const CHAT_ENDPOINT = `${API_BASE}/api/v1/chat/chat`;

export interface ChatReply {
  response: string;
  session_id: string | null;
}

export async function sendMessageToAPI(message: string, sessionId: string | null): Promise<ChatReply> {
  console.log('Sending to:', CHAT_ENDPOINT); // Debug log
  
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