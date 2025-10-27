import type { StoredHistorySession } from '@/features/chat/historyStore';

type ChatListProps = {
  userId?: string;
  locale: string;
  sessions: StoredHistorySession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onStartNewSession: () => void;
  emptyMessage: string;
  signInCtaLabel: string;
  signInButtonLabel: string;
  newChatLabel: string;
};

function formatRelativeTime(ms: number, locale: string) {
  const diffSeconds = Math.round((Date.now() - ms) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    const value = diffSeconds === 0 ? -1 : -diffSeconds;
    return rtf.format(value, 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(-diffDays, 'day');
}

function deriveTitle(session: StoredHistorySession) {
  if (session.title) return session.title;
  const firstUserMessage = session.messages.find((m) => m.role === 'user');
  if (firstUserMessage?.text) return firstUserMessage.text.slice(0, 60) || 'Conversation';
  const firstAssistant = session.messages.find((m) => m.role === 'assistant');
  if (firstAssistant?.text) return firstAssistant.text.slice(0, 60) || 'Conversation';
  return 'Conversation';
}

function derivePreview(session: StoredHistorySession) {
  if (!session.messages.length) return '';
  const last = session.messages[session.messages.length - 1];
  return last.text.slice(0, 80);
}

export default function ChatList({
  userId,
  locale,
  sessions,
  activeSessionId,
  onSelectSession,
  onStartNewSession,
  emptyMessage,
  signInCtaLabel,
  signInButtonLabel,
  newChatLabel,
}: ChatListProps) {
  if (!userId) {
    return (
      <div>
        <p>{signInCtaLabel}</p>
        <a className="btn btn-primary" href="/login">{signInButtonLabel}</a>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div>
        <p className="muted">{emptyMessage}</p>
        <button type="button" className="btn btn-secondary" onClick={onStartNewSession}>
          {newChatLabel}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: '100%', marginBottom: '0.75rem' }}
        onClick={onStartNewSession}
      >
        {newChatLabel}
      </button>
      <ul className="chatlist">
        {sessions.map((session) => {
          const title = deriveTitle(session);
          const preview = derivePreview(session);
          const lastUpdated = session.updatedAt ?? session.createdAt;

          return (
            <li key={session.id}>
              <button
                className={`linklike${session.id === activeSessionId ? ' is-active' : ''}`}
                type="button"
                onClick={() => onSelectSession(session.id)}
              >
                <span className="chatlist-title">{title}</span>
                <span className="chatlist-meta muted small">{formatRelativeTime(lastUpdated, locale)}</span>
                {preview ? <span className="chatlist-preview muted small">{preview}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
