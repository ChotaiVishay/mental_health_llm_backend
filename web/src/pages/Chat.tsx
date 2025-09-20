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
 * The storage layer (sessionStore) keeps a timestamp on each message.
 * Our UI component types do not. Add small adapters so we can persist
 * without changing the UI types.
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
            role: 'assistant', // stays as the literal type
            text: 'Hi! How can I help you today?',
          } as Message,        // 👈 make this object a Message
        ];

  setMessages(initial);
}, [user?.id]);

  // Persist on every change (convert UI -> storage shape that includes `at`)
  useEffect(() => {
    const prev = user?.id
      ? loadUserChat(String(user.id)) ?? undefined
      : loadPreloginChat() ?? undefined;

    const payload = { messages: toStore(messages, prev?.messages as unknown as ChatMessageStore[] | undefined) };

    if (user?.id) {
      saveUserChat(String(user.id), payload as any);
    } else {
      savePreloginChat(payload as any);
    }
  }, [messages, user?.id]);

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