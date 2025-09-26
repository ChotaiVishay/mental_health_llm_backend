// web/src/components/chat/MessageList.tsx
import React from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type Props = { items: Message[] };

/**
 * Screen-reader friendly transcript.
 * - <ol> keeps message order clear
 * - .msg.{assistant|user} enables themed bubbles
 */
export default function MessageList({ items }: Props) {
  return (
    <ol className="transcript" aria-label="Conversation">
      {items.map((m) => (
        <li key={m.id} className={`msg ${m.role}`}>
          <div className="bubble">
            {m.role === 'assistant' && (
              <div className="msg-meta">Support Atlas Assistant</div>
            )}
            <div className="msg-text">{m.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}