import { useState, FormEvent, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
};

export default function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  // ✅ ask for English (US) by default; interim results on
  const stt = useSpeechToText({ lang: 'en-US', interim: true });

  useEffect(() => {
    if (stt.finalText) {
      setValue((prev) => (prev ? (prev + ' ' + stt.finalText).trim() : stt.finalText!));
    }
  }, [stt.finalText]);

  const listeningHint =
    stt.isListening ? 'Listening…' : stt.error ? stt.error : 'Ask a question…';

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = (value || '').trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  }

  return (
    <form className="chat-input" onSubmit={submit} aria-label="Send a message">
      <label htmlFor="chat-input" className="sr-only">Message</label>
      <textarea
        id="chat-input"
        placeholder={listeningHint}
        rows={2}
        value={stt.isListening && stt.interim ? stt.interim : value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <div className="composer-actions" role="group" aria-label="Composer actions">
        <button
          type="button"
          className={`btn ${stt.isListening ? 'listening' : ''}`}
          aria-pressed={stt.isListening}
          aria-label={stt.isListening ? 'Stop voice input' : 'Start voice input'}
          onClick={() => (stt.isListening ? stt.stop() : stt.start(navigator.language || 'en-AU'))}
          disabled={disabled || !stt.isSupported}
          title={stt.isSupported ? (stt.isListening ? 'Stop dictation' : 'Speak instead of typing') : 'Voice input not supported in this browser'}
        >
          🎤
        </button>
        <button className="btn primary" type="submit" disabled={disabled || !value.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}