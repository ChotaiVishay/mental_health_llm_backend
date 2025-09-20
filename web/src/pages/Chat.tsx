// web/src/pages/Chat.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import Title from '@/components/misc/Title';
import MessageList, { Message } from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { useAuth } from '@/auth/AuthContext';
import {
  loadPreloginChat,
  savePreloginChat,
  loadUserChat,
  saveUserChat,
  type ChatSession,
  type ChatMessage as ChatMsgStore, // <- use the typed message from sessionStore
} from '@/features/chat/sessionStore';

/** Storage shape (has timestamp) vs UI shape (no timestamp) */
type ChatMessageStore = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: number;
};

function mkId() {
  return Math.random().toString(36).slice(2);
}

function toUI(items?: ChatMessageStore[]): Message[] {
  if (!items?.length) return [];
  return items.map(({ id, role, text }) => ({ id, role, text }));
}

function toStore(items: Message[], prev?: ChatMessageStore[]): ChatMessageStore[] {
  const now = Date.now();
  const prevMap = new Map(prev?.map((m) => [m.id, m.at]));
  return items.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    at: prevMap.get(m.id) ?? now,
  }));
}

/** Relative time like "just now", "2m ago", "1h ago" */
function relative(ms: number) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Track “am I near the bottom?” and provide a smooth scroller */
function useAtBottom(ref: React.RefObject<HTMLElement>, threshold = 64) {
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAtBottom(dist <= threshold);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref, threshold]);

  const scrollToBottom = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return { atBottom, scrollToBottom };
}

export default function Chat() {
  const { user } = useAuth();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { atBottom, scrollToBottom } = useAtBottom(scrollerRef);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Initial load (depends on auth state)
  useEffect(() => {
    const session: ChatSession | null = user?.id
      ? loadUserChat(String(user.id)) ?? loadPreloginChat()
      : loadPreloginChat();

    if (session?.messages?.length) {
      setMessages(toUI(session.messages as unknown as ChatMessageStore[]));
      // remove `any` by using the exported ChatMessage type
      const maxAt = Math.max(
        ...session.messages.map((m: ChatMsgStore) => Number(m.at) || 0)
      );
      setLastActivity(Number.isFinite(maxAt) ? maxAt : Date.now());
    } else {
      const seed: Message = {
        id: mkId(),
        role: 'assistant',
        text: 'Hi! How can I help you today?',
      };
      setMessages([seed]);
      setLastActivity(Date.now());
    }
  }, [user?.id]);

  // Persist whenever UI messages change
  useEffect(() => {
    const prev = user?.id
      ? loadUserChat(String(user.id)) ?? undefined
      : loadPreloginChat() ?? undefined;

    const payload = {
      messages: toStore(
        messages,
        (prev?.messages as unknown as ChatMessageStore[] | undefined)
      ),
    };

    // update “last activity”
    const maxAt =
      payload.messages.length > 0
        ? Math.max(...payload.messages.map((m) => m.at))
        : Date.now();
    setLastActivity(maxAt);

    if (user?.id) {
      saveUserChat(String(user.id), payload as { messages: ChatMessageStore[] });
    } else {
      savePreloginChat(payload as { messages: ChatMessageStore[] });
    }
  }, [messages, user?.id]);

  // Auto-scroll only if you were already at the bottom
  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [messages.length, atBottom, scrollToBottom]);

  const onSend = async (text: string) => {
    const userMsg: Message = { id: mkId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    // Simulated assistant
    await new Promise((r) => setTimeout(r, 350)); // tiny delay so the typing indicator is visible

    const reply: Message = {
      id: mkId(),
      role: 'assistant',
      text: `You said: "${text}". I’ll look that up.`,
    };
    setMessages((prev) => [...prev, reply]);
    setBusy(false);
  };

  const lastActivityLabel = useMemo(() => relative(lastActivity), [lastActivity]);

  return (
    <>
      <Title value="Support Atlas Assistant — Chat" />

      <section className="chat-wrapper">
        <div ref={scrollerRef} className="chat-scroller">
          {/* Anonymous banner (scrolls with history so composer stays fixed) */}
          {!user && (
            <div className="card fade-in" role="note" aria-live="polite">
              <span className="muted">
                You’re chatting <strong>anonymously</strong>. <strong>Sign in</strong> to
                save your conversation for later.
              </span>
              <a className="btn btn-secondary" href="/login">
                Sign in
              </a>
            </div>
          )}

          <MessageList items={messages} />

          {/* Typing indicator (assistant) */}
          {busy && (
            <div className="typing-row" aria-live="polite" aria-label="Assistant is typing">
              <div className="typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          {/* Jump-to-latest appears when you scroll up */}
          {!atBottom && (
            <button className="jump-latest" onClick={scrollToBottom}>
              Jump to latest
            </button>
          )}
        </div>

        <div className="chat-composer">
          <div className="composer-meta">
            <span className="muted small">Last activity {lastActivityLabel}</span>
          </div>
          <MessageInput onSend={onSend} disabled={busy} />
        </div>
      </section>
    </>
  );
}