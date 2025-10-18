// web/src/components/chat/MessageList.tsx
import { speak } from '@/hooks/useTextToSpeech';
import { markdownToHtml } from '@/utils/markdown';

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
            <div className="msg-meta">
              Support Atlas Assistant
              <button
                type="button"
                className="icon-inline"
                aria-label="Play this reply"
                onClick={() => speak(m.text)}
                title="Play reply"
              >
                🔊
              </button>
            </div>
          )}
          {m.role === 'assistant' ? (
            <div
              className="msg-text"
              // The content comes from our backend LLM. We escape HTML
              // before converting lightweight Markdown to HTML in the
              // renderer to reduce XSS risk.
              dangerouslySetInnerHTML={{ __html: markdownToHtml(m.text) }}
            />
          ) : (
            <div className="msg-text">{m.text}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
