// web/src/components/chat/MessageList.tsx
import { speak } from '@/hooks/useTextToSpeech';
import { markdownToHtml } from '@/utils/markdown';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Fragment, useMemo } from 'react';
import { Volume2 } from 'lucide-react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at?: number;
};

type Props = { items: Message[] };

export default function MessageList({ items }: Props) {
  const { locale } = useLanguage();
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
    [locale],
  );

  let lastTimestamp: number | null = null;

  return (
    <ul className="transcript" aria-label="Conversation">
      {items.map((m) => {
        const messageTime = typeof m.at === 'number' ? m.at : null;
        const showTimestamp = messageTime !== null
          && (lastTimestamp === null || Math.abs(messageTime - lastTimestamp) > 5 * 60 * 1000);

        if (messageTime !== null) {
          lastTimestamp = messageTime;
        }

        return (
          <Fragment key={m.id}>
            {showTimestamp && messageTime !== null && (
              <li className="msg-timestamp" aria-hidden="true">
                {formatter.format(new Date(messageTime))}
              </li>
            )}
            <li className={`msg ${m.role}`}>
              {m.role === 'assistant' && (
                <div className="msg-meta">
                  Support Atlas Assistant
                  <button
                    type="button"
                    className="icon-inline"
                    aria-label="Play this reply"
                    onClick={() => speak(m.text, locale)}
                    title="Play reply"
                  >
                    <Volume2 aria-hidden="true" />
                  </button>
                </div>
              )}
              {m.role === 'assistant' ? (
                <div
                  className="msg-text"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(m.text) }}
                />
              ) : (
                <div className="msg-text">{m.text}</div>
              )}
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
