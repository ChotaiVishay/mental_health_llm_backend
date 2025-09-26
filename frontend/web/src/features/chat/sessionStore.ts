export type Role = 'user' | 'assistant';
export interface ChatMessage { id: string; role: Role; text: string; at: number }
export interface ChatSession { messages: ChatMessage[] }

const PRE_KEY = 'sa_prelogin_chat_v1';
const USER_KEY = (uid: string) => `sa_chat_${uid}_v1`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, v: T) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Intentionally ignore quota/private mode errors when persisting chat
  }
}

function del(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Intentionally ignore storage removal errors
  }
}

export function loadPreloginChat(): ChatSession | null { return read<ChatSession>(PRE_KEY); }
export function savePreloginChat(s: ChatSession) { write(PRE_KEY, s); }
export function clearPreloginChat() { del(PRE_KEY); }

export function loadUserChat(userId: string): ChatSession | null { return read<ChatSession>(USER_KEY(userId)); }
export function saveUserChat(userId: string, s: ChatSession) { write(USER_KEY(userId), s); }
export function clearUserChat(userId: string) { del(USER_KEY(userId)); }

/** Merge pre-login chat into the user’s store; keep order, de-dupe by id. */
export function mergePreloginIntoUser(userId: string): ChatSession | null {
  const pre = loadPreloginChat();
  const existing = loadUserChat(userId) ?? { messages: [] };
  if (!pre) return existing;

  const byId = new Map<string, ChatMessage>();
  [...existing.messages, ...pre.messages]
    .sort((a, b) => a.at - b.at)
    .forEach(m => byId.set(m.id, m));

  const merged: ChatSession = { messages: Array.from(byId.values()) };
  saveUserChat(userId, merged);
  clearPreloginChat();
  return merged;
}