import type { ChatMessage, PendingPrompt } from './sessionStore';

const HISTORY_VERSION = 1;
const HISTORY_KEY = (uid: string) => `sa_chat_history_${uid}_v${HISTORY_VERSION}`;
const MAX_SESSIONS = 20;

type Role = ChatMessage['role'];

export interface StoredHistorySession {
  id: string;
  backendSessionId: string | null;
  title: string | null;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatHistoryState {
  version: number;
  sessions: StoredHistorySession[];
  activeSessionId: string | null;
  pendingPrompt?: PendingPrompt;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Swallow quota/private mode errors
  }
}

function del(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore removal errors
  }
}

function mkId() {
  return `hst_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function sanitizeRole(value: unknown): Role | null {
  return value === 'assistant' || value === 'user' ? value : null;
}

function sanitizeMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const role = sanitizeRole(data.role);
  if (!role) return null;
  const id = typeof data.id === 'string' && data.id.trim().length ? data.id : mkId();
  const text = typeof data.text === 'string' ? data.text : '';
  const atValue = data.at;
  const at = typeof atValue === 'number' && Number.isFinite(atValue) ? atValue : Date.now();
  return { id, role, text, at };
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => sanitizeMessage(item))
    .filter((item): item is ChatMessage => Boolean(item));
}

function sanitizeSession(raw: unknown): StoredHistorySession | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const id = typeof data.id === 'string' && data.id.trim().length ? data.id : mkId();
  const backendSessionId =
    typeof data.backendSessionId === 'string' && data.backendSessionId.trim().length
      ? data.backendSessionId
      : null;
  const title = typeof data.title === 'string' && data.title.trim().length ? data.title : null;
  const createdAtValue = data.createdAt;
  const updatedAtValue = data.updatedAt;
  const createdAt =
    typeof createdAtValue === 'number' && Number.isFinite(createdAtValue)
      ? createdAtValue
      : Date.now();
  const updatedAt =
    typeof updatedAtValue === 'number' && Number.isFinite(updatedAtValue)
      ? updatedAtValue
      : createdAt;
  const messages = sanitizeMessages(data.messages);
  return {
    id,
    backendSessionId,
    title,
    createdAt,
    updatedAt,
    messages,
  };
}

function sanitizePending(prompt: unknown): PendingPrompt | undefined {
  if (!prompt || typeof prompt !== 'object') return undefined;
  const data = prompt as Record<string, unknown>;
  const text = typeof data.text === 'string' ? data.text : null;
  const createdAtValue = data.createdAt;
  const createdAt =
    typeof createdAtValue === 'number' && Number.isFinite(createdAtValue)
      ? createdAtValue
      : Date.now();
  if (!text) return undefined;
  return { text, createdAt };
}

function emptyHistory(): ChatHistoryState {
  return {
    version: HISTORY_VERSION,
    sessions: [],
    activeSessionId: null,
  };
}

function normalizeHistory(raw: unknown): ChatHistoryState {
  if (!raw || typeof raw !== 'object') {
    return emptyHistory();
  }

  const data = raw as Record<string, unknown>;
  const version = typeof data.version === 'number' ? data.version : HISTORY_VERSION;
  const sessionsRaw = data.sessions;
  const sessions = Array.isArray(sessionsRaw)
    ? sessionsRaw
        .map((session) => sanitizeSession(session))
        .filter((session): session is StoredHistorySession => Boolean(session))
    : [];

  const active =
    typeof data.activeSessionId === 'string' && data.activeSessionId.trim().length
      ? data.activeSessionId
      : sessions[0]?.id ?? null;

  const pendingPrompt = sanitizePending(data.pendingPrompt);

  if (sessions.length > MAX_SESSIONS) {
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    sessions.length = MAX_SESSIONS;
  }

  return {
    version,
    sessions,
    activeSessionId: active,
    ...(pendingPrompt ? { pendingPrompt } : {}),
  };
}

function getHistory(userId: string): ChatHistoryState {
  return normalizeHistory(read<unknown>(HISTORY_KEY(userId)));
}

function persistHistory(userId: string, history: ChatHistoryState) {
  const payload: ChatHistoryState = {
    ...history,
    version: HISTORY_VERSION,
    sessions: [...history.sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS),
  };
  write(HISTORY_KEY(userId), payload);
}

function updateHistory(
  userId: string,
  updater: (history: ChatHistoryState) => ChatHistoryState,
): ChatHistoryState {
  const current = getHistory(userId);
  const updated = updater(current);
  persistHistory(userId, updated);
  return updated;
}

function ensureSession(history: ChatHistoryState, sessionId: string): StoredHistorySession | null {
  return history.sessions.find((session) => session.id === sessionId) ?? null;
}

export function listSessions(userId: string): StoredHistorySession[] {
  return [...getHistory(userId).sessions];
}

export function getActiveSession(userId: string): StoredHistorySession | null {
  const history = getHistory(userId);
  if (!history.activeSessionId) return history.sessions[0] ?? null;
  return (
    history.sessions.find((session) => session.id === history.activeSessionId) ??
    history.sessions[0] ??
    null
  );
}

export function getSessionById(userId: string, sessionId: string): StoredHistorySession | null {
  const history = getHistory(userId);
  return ensureSession(history, sessionId);
}

export function findSessionByBackendId(
  userId: string,
  backendSessionId: string,
): StoredHistorySession | null {
  const history = getHistory(userId);
  return (
    history.sessions.find(
      (session) => session.backendSessionId && session.backendSessionId === backendSessionId,
    ) ?? null
  );
}

export function setActiveSessionId(userId: string, sessionId: string): StoredHistorySession | null {
  let active: StoredHistorySession | null = null;
  updateHistory(userId, (history) => {
    const session = ensureSession(history, sessionId);
    if (!session) return history;
    active = session;
    return { ...history, activeSessionId: sessionId };
  });
  return active;
}

export function createSession(
  userId: string,
  seed?: Partial<Omit<StoredHistorySession, 'id'>>,
): StoredHistorySession {
  const now = Date.now();
  const session: StoredHistorySession = {
    id: mkId(),
    backendSessionId: seed?.backendSessionId ?? null,
    title: seed?.title ?? null,
    createdAt: seed?.createdAt ?? now,
    updatedAt: seed?.updatedAt ?? now,
    messages: seed?.messages ? sanitizeMessages(seed.messages) : [],
  };
  updateHistory(userId, (history) => {
    const sessions = [session, ...history.sessions];
    if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
    return {
      ...history,
      sessions,
      activeSessionId: session.id,
    };
  });
  return session;
}

export function recordMessages(
  userId: string,
  sessionId: string,
  messages: ChatMessage[],
): StoredHistorySession | null {
  let stored: StoredHistorySession | null = null;
  updateHistory(userId, (history) => {
    const sanitized = sanitizeMessages(messages);
    const now = Date.now();
    let session = ensureSession(history, sessionId);
    if (!session) {
      session = {
        id: sessionId,
        backendSessionId: null,
        title: null,
        createdAt: now,
        updatedAt: now,
        messages: sanitized,
      };
    } else {
      session = {
        ...session,
        messages: sanitized,
        updatedAt: now,
      };
    }
    stored = session;
    const rest = history.sessions.filter((item) => item.id !== session.id);
    const sessions = [session, ...rest];
    if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
    return {
      ...history,
      sessions,
      activeSessionId: session.id,
    };
  });
  return stored;
}

export function updateSessionMetadata(
  userId: string,
  sessionId: string,
  patch: Partial<Omit<StoredHistorySession, 'id' | 'messages'>>,
): StoredHistorySession | null {
  let stored: StoredHistorySession | null = null;
  updateHistory(userId, (history) => {
    const current = ensureSession(history, sessionId);
    if (!current) return history;
    stored = {
      ...current,
      ...patch,
      updatedAt: patch.updatedAt ?? Date.now(),
    };
    const rest = history.sessions.filter((item) => item.id !== sessionId);
    const sessions = [stored, ...rest];
    if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
    return {
      ...history,
      sessions,
      activeSessionId: sessionId,
    };
  });
  return stored;
}

export function setPendingPrompt(userId: string, prompt: PendingPrompt | null) {
  updateHistory(userId, (history) => {
    const next = { ...history };
    if (prompt) {
      next.pendingPrompt = prompt;
    } else if ('pendingPrompt' in next) {
      delete (next as { pendingPrompt?: PendingPrompt }).pendingPrompt;
    }
    return next;
  });
}

export function getPendingPrompt(userId: string): PendingPrompt | null {
  const history = getHistory(userId);
  return history.pendingPrompt ?? null;
}

export function clearHistory(userId: string) {
  del(HISTORY_KEY(userId));
}
