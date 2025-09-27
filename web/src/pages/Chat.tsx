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
  type ChatMessage as ChatMsgStore,
} from '@/features/chat/sessionStore';
import ChatList from '@/components/chat/ChatList';
import { sendMessageToAPI } from '@/api/chat';
import '@/styles/pages/chat.css';

type ChatMessageStore = { id: string; role: 'user' | 'assistant'; text: string; at: number };

function mkId() { return Math.random().toString(36).slice(2); }
function toUI(items?: ChatMessageStore[]): Message[] {
  if (!items?.length) return [];
  return items.map(({ id, role, text }) => ({ id, role, text }));
}
function toStore(items: Message[], prev?: ChatMessageStore[]): ChatMessageStore[] {
  const now = Date.now();
  const prevMap = new Map(prev?.map((m) => [m.id, m.at]));
  return items.map((m) => ({ id: m.id, role: m.role, text: m.text, at: prevMap.get(m.id) ?? now }));
}
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
  const scrollToBottom = () => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  return { atBottom, scrollToBottom };
}

export default function Chat() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const { atBottom, scrollToBottom } = useAtBottom(scrollerRef);

  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [netErr, setNetErr] = useState<string | null>(null); // NEW: surface network errors

  // initial load
  useEffect(() => {
    const session: ChatSession | null = user?.id
      ? loadUserChat(String(user.id)) ?? loadPreloginChat()
      : loadPreloginChat();

    if (session?.messages?.length) {
      setMessages(toUI(session.messages as unknown as ChatMessageStore[]));
      const maxAt = Math.max(...session.messages.map((m: ChatMsgStore) => Number(m.at) || 0));
      setLastActivity(Number.isFinite(maxAt) ? maxAt : Date.now());
    } else {
      setMessages([{ id: mkId(), role: 'assistant', text: 'Hi! How can I help you today?' }]);
      setLastActivity(Date.now());
    }
  }, [user?.id]);

  // persist
  useEffect(() => {
    const prev = user?.id ? loadUserChat(String(user.id)) ?? undefined : loadPreloginChat() ?? undefined;
    const payload = { messages: toStore(messages, (prev?.messages as unknown as ChatMessageStore[] | undefined)) };
    const maxAt = payload.messages.length ? Math.max(...payload.messages.map((m) => m.at)) : Date.now();
    setLastActivity(maxAt);
    if (user?.id) saveUserChat(String(user.id), payload as { messages: ChatMessageStore[] });
    else savePreloginChat(payload as { messages: ChatMessageStore[] });
  }, [messages, user?.id]);

  useEffect(() => { if (atBottom) scrollToBottom(); }, [messages.length, atBottom, scrollToBottom]);

  const onSend = async (text: string) => {
    setNetErr(null); // clear any previous network error
    const userMsg: Message = { id: mkId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    try {
      const reply = await sendMessageToAPI(text, user?.id ?? null);
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: reply.response }]);
    } catch {
      // Friendly error + keep composer usable
      setNetErr('Network error — please try again.');
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: 'Sorry, something went wrong.' }]);
    } finally {
      setBusy(false);
    }
  };

  const lastActivityLabel = useMemo(() => relative(lastActivity), [lastActivity]);

  return (
    <>
      <Title value="Support Atlas — Chat" />

      {/* Signed-out banner */}
      {!user && (
        <div className="anon-banner" role="note" aria-live="polite">
          <span>You’re chatting <strong>anonymously</strong>. Sign in to save your conversation for later.</span>
          <a className="btn btn-secondary" href="/login">Sign in</a>
        </div>
      )}

      {/* Collapsible layout */}
      <div className={`chat-page ${sidebarOpen ? '' : '-collapsed'}`}>
        {/* Sidebar */}
        {sidebarOpen ? (
          <aside className="chat-sidebar">
            <header className="sidebar-head">
              <h2 className="h3" style={{ margin: 0 }}>Conversations</h2>
              <button className="icon-btn" aria-label="Hide conversations" onClick={() => setSidebarOpen(false)}>
                ×
              </button>
            </header>
            <div className="sidebar-body">
              <ChatList />
            </div>
          </aside>
        ) : (
          <button
            className="hambtn"
            aria-label="Open chat history"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
        )}

        {/* Main chat panel */}
        <section className="chat-main">
          <header className="chat-head">
            <h2 className="h2" style={{ margin: 0 }}>Chat</h2>
            <span className="muted small">Last activity {lastActivityLabel}</span>
          </header>

          {/* NEW: network error banner */}
          {netErr && (
            <div
              role="alert"
              className="card"
              style={{ margin: '12px 16px 0', borderColor: '#f59e0b', background: '#fff7ed' }}
            >
              {netErr}
            </div>
          )}

          <div ref={scrollerRef} className="chat-scroller">
            <MessageList items={messages} />
            {busy && (
              <div className="typing-row" aria-live="polite" aria-label="Assistant is typing">
                <div className="typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            {!atBottom && (
              <button className="jump-latest" onClick={scrollToBottom}>
                Jump to latest
              </button>
            )}
          </div>

          <div className="composer-bar">
            <MessageInput onSend={onSend} disabled={busy} />
          </div>
        </section>
      </div>
    </>
  );
}