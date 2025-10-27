import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSession,
  recordMessages,
  listSessions,
  getActiveSession,
  setActiveSessionId,
  setPendingPrompt,
  getPendingPrompt,
  clearHistory,
} from '@/features/chat/historyStore';
import type { ChatMessage } from '@/features/chat/sessionStore';

const USER_ID = 'user-test';

describe('historyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    clearHistory(USER_ID);
  });

  it('creates sessions and records messages', () => {
    const created = createSession(USER_ID);

    const message: ChatMessage = { id: 'm1', role: 'user', text: 'Hello', at: 1_000 };
    recordMessages(USER_ID, created.id, [message]);

    const sessions = listSessions(USER_ID);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.messages).toEqual([message]);
    expect(getActiveSession(USER_ID)?.id).toBe(created.id);
  });

  it('updates active session selection', () => {
    const first = createSession(USER_ID);
    recordMessages(USER_ID, first.id, [
      { id: 'm-first', role: 'user', text: 'First', at: 2_000 },
    ]);

    const second = createSession(USER_ID);
    recordMessages(USER_ID, second.id, [
      { id: 'm-second', role: 'assistant', text: 'Second', at: 3_000 },
    ]);

    // Sanity: most recent session is active
    expect(getActiveSession(USER_ID)?.id).toBe(second.id);

    setActiveSessionId(USER_ID, first.id);
    expect(getActiveSession(USER_ID)?.id).toBe(first.id);
  });

  it('stores and clears pending prompts', () => {
    createSession(USER_ID);
    const prompt = { text: 'Please send automatically', createdAt: 4_000 };

    setPendingPrompt(USER_ID, prompt);
    expect(getPendingPrompt(USER_ID)).toEqual(prompt);

    setPendingPrompt(USER_ID, null);
    expect(getPendingPrompt(USER_ID)).toBeNull();
  });
});
