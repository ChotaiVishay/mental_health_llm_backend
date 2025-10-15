import { useEffect, useState } from 'react';
import { fetchChatSessions, type ChatSession } from '@/api/chat';
import { useAuth } from '@/auth/AuthContext';

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'empty' | 'error'>('idle');

  useEffect(() => {
    if (!user) {
      setState('empty'); // show CTA instead of error while logged out
      return;
    }
    let alive = true;
    setState('loading');
    fetchChatSessions()
      .then((rows) => {
        if (!alive) return;
        setChats(rows);
        setState(rows.length ? 'ok' : 'empty');
      })
      .catch(() => {
        if (!alive) return;
        setState('error');
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div>
        <p>Sign in to view and continue previous conversations.</p>
        <a className="btn btn-primary" href="/login">Sign in</a>
      </div>
    );
  }

  if (state === 'loading') return <p className="muted">Loading conversations…</p>;
  if (state === 'error') return <p className="muted">Couldn’t load conversations.</p>;
  if (state === 'empty') return <p className="muted">No conversations yet.</p>;

  return (
    <ul className="chatlist">
      {chats.map((c) => (
        <li key={c.id}>
          <button className="linklike" type="button" title={c.title ?? 'Conversation'}>
            {c.title ?? 'Conversation'}
          </button>
        </li>
      ))}
    </ul>
  );
}