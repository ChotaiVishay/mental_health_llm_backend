import { useEffect, useState } from 'react';
import { fetchChatSessions, type ChatSession } from '@/api/chat';

export default function ChatList() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatSessions()
      .then(setChats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p>Error: {error}</p>;
  if (!chats.length) return <p>Loading chats...</p>;

  return (
    <ul>
      {chats.map((chat) => (
        <li key={chat.id}>
          {chat.title}
        </li>
      ))}
    </ul>
  );
}