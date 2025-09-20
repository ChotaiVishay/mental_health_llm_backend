// src/features/chat/sessionStore.ts
const KEY = 'sa_prelogin_chat_v1';

export interface PreloginChat {
  messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; at: number }>;
}

export function loadPreloginChat(): PreloginChat | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PreloginChat) : null;
  } catch {
    return null;
  }
}

export function savePreloginChat(payload: PreloginChat) {
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function clearPreloginChat() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}