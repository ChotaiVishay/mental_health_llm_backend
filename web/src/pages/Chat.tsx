// web/src/pages/Chat.tsx
import { useEffect, useRef, useState } from 'react';
import Title from '@/components/misc/Title';
import MessageList, { Message } from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { useAuth } from '@/auth/AuthContext';
import {
  loadPreloginChat,
  savePreloginChat,
  loadUserChat,
  saveUserChat,
} from '@/features/chat/sessionStore';

/**
 * sessionStore messages include a timestamp `at`; the UI type does not.
 * These adapters let us persist without changing the UI types.
 */
type ChatMessageStore = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: number;
};

function toUI(items: ChatMessageStore[] | undefined): Message[] {
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

function mkId() {
  return Math.random().toString(36).slice(2);
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Load current session (depends on auth state)
  useEffect(() => {
    const session = user?.id
      ? loadUserChat(String(user.id)) ?? loadPreloginChat()
      : loadPreloginChat();

    const initial: Message[] =
      session?.messages?.length
        ? toUI(session.messages as unknown as ChatMessageStore[])
        : [
            {
              id: mkId(),
              role: 'assistant',
              text: 'Hi! How can I help you today?',
            } satisfies Message,
          ];

    setMessages(initial);
  }, [user?.id]);

  // Persist on every change (convert UI -> storage shape that includes `at`)
  useEffect(() => {
    const prev = user?.id
      ? loadUserChat(String(user.id)) ?? undefined
      : loadPreloginChat() ?? undefined;

    const payload = {
      messages: toStore(messages, prev?.messages as unknown as ChatMessageStore[] | undefined),
    };

    if (user?.id) {
      saveUserChat(String(user.id), payload as unknown as { messages: ChatMessageStore[] });
    } else {
      savePreloginChat(payload as unknown as { messages: ChatMessageStore[] });
    }
  }, [messages, user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length]);

  const onSend = async (text: string) => {
    const userMsg: Message = { id: mkId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    // MVP mock reply
    const reply: Message = {
      id: mkId(),
      role: 'assistant',
      text: `You said: "${text}". I’ll look that up.`,
    };
    setMessages((prev) => [...prev, reply]);
    setBusy(false);
  };

  return (
    <>
      <Title value="Support Atlas Assistant — Chat" />

      {/* Anonymous banner (only when not signed in) */}
      {!user && (
        <div
          className="card"
          role="note"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <span className="muted">
            You’re chatting anonymously. <strong>Sign in</strong> to save your conversation for later.
          </span>
          <a className="btn btn-secondary" href="/login">
            Sign in
          </a>
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateRows: '1fr auto',
          height: 'calc(100vh - 160px)',
          gap: 12,
        }}
      >
        <div ref={scrollerRef} style={{ overflow: 'auto', paddingRight: 4 }}>
          <MessageList items={messages} />
        </div>
        <MessageInput onSend={onSend} disabled={busy} />
      </section>
    </>
  );
}