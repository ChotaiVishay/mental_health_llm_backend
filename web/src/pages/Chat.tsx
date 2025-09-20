import { useEffect, useRef, useState } from 'react';
import Title from '@/components/misc/Title';
import MessageList, { Message } from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { loadPreloginChat, clearPreloginChat } from '@/features/chat/sessionStore';
import { useAuth } from '@/auth/AuthContext';
import { getAndClearReturnTo } from '@/auth/storage';

function mkId() {
  return Math.random().toString(36).slice(2);
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: mkId(), role: 'assistant', text: 'Hi! How can I help you today?' }
  ]);
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const mergedOnceRef = useRef(false);

  // Merge pre-login cached messages AFTER login completes (once).
  useEffect(() => {
    if (!user || mergedOnceRef.current) return;

    const cached = loadPreloginChat();
    if (cached?.messages?.length) {
      setMessages((prev) => {
        // Keep the greeting on top, then insert cached user messages.
        if (prev.length > 0) {
          const [first, ...rest] = prev;
          return [first, ...cached.messages, ...rest];
        }
        return [...cached.messages, ...prev];
      });
      clearPreloginChat();
    }

    // consume any saved returnTo so it doesn't affect future navigations
    getAndClearReturnTo();
    mergedOnceRef.current = true;
  }, [user]);

  const onSend = async (text: string) => {
    const userMsg: Message = { id: mkId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    // MVP mock assistant reply
    const reply: Message = {
      id: mkId(),
      role: 'assistant',
      text: `You said: "${text}". I’ll look that up.`
    };
    setMessages((prev) => [...prev, reply]);
    setBusy(false);
  };

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      <Title value="Support Atlas Assistant — Chat" />
      <section style={{ display: 'grid', gridTemplateRows: '1fr auto', height: 'calc(100vh - 160px)', gap: 12 }}>
        <div ref={scrollerRef} style={{ overflow: 'auto', paddingRight: 4 }}>
          <MessageList items={messages} />
        </div>
        <MessageInput onSend={onSend} disabled={busy} />
      </section>
    </>
  );
}