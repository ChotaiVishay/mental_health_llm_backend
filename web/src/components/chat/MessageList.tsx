export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type Props = { items: Message[] };

export default function MessageList({ items }: Props) {
  return (
    <ul className="transcript" aria-label="Conversation">
      {items.map((m) => (
        <li key={m.id} className={`msg ${m.role}`}>
          {m.role === 'assistant' && (
            <div className="msg-meta">Support Atlas Assistant</div>
          )}
          <div className="msg-text">{m.text}</div>
        </li>
      ))}
    </ul>
  );
}