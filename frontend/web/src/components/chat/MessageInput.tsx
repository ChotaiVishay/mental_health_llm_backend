import { useState, FormEvent, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useMicRecorder } from '@/hooks/useMicRecorder';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  onOpenServiceForm?: () => void;
  disableServiceButton?: boolean;
};

export default function MessageInput({ onSend, disabled, onOpenServiceForm, disableServiceButton }: Props) {
  const [value, setValue] = useState('');
  const stt = useSpeechToText();           // Chrome path
  const rec = useMicRecorder();            // Fallback path

  // Keep dictated text after the mic stops: append final transcript, or last interim if no final arrives.
  useEffect(() => {
    const t = stt.finalText;
    if (!t) return;
    setValue((prev) => (prev ? `${prev} ${t}`.trim() : t));
  }, [stt.finalText]);

  useEffect(() => {
    // If the user stops speaking and we only had interim text, keep that in the box.
    if (!stt.isListening && !stt.error && stt.interim && !stt.finalText) {
      setValue((prev) => (prev ? `${prev} ${stt.interim}`.trim() : stt.interim));
    }
  }, [stt.isListening, stt.error, stt.interim, stt.finalText]);

  async function uploadAndInsert(blob: Blob) {
    const fd = new FormData();
    fd.append('audio', blob, 'voice.webm');
    const r = await fetch('/api/stt', { method: 'POST', body: fd });
    const { text } = (await r.json()) as { text?: string };
    if (text) setValue((prev) => (prev ? `${prev} ${text}` : text));
  }

  async function handleMicClick() {
    // Prefer native STT where supported
    if (stt.isSupported) {
      if (stt.isListening) stt.stop();
      else stt.start(typeof navigator !== 'undefined' ? navigator.language || 'en-AU' : 'en-AU');
      return;
    }
    // Fallback recorder (Edge/Firefox/Safari)
    if (!rec.recording) {
      await rec.start();
    } else {
      const blob = rec.stop();
      if (blob) await uploadAndInsert(blob);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  }

  const placeholder =
    stt.isSupported
      ? stt.isListening
        ? 'Listening…'
        : stt.error || 'Ask anything…'
      : rec.recording
        ? 'Recording… click mic to stop'
        : rec.error || 'Ask anything…';

  return (
    <form className="chat-input" onSubmit={submit} aria-label="Send a message">
      <label htmlFor="chat-input" className="sr-only">Message</label>
      <textarea
        id="chat-input"
        rows={2}
        placeholder={placeholder}
        value={stt.isSupported && stt.isListening && stt.interim ? stt.interim : value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <div className="composer-actions" role="group" aria-label="Composer actions">
        <button
          type="button"
          className={`btn ${stt.isListening || rec.recording ? 'listening' : ''}`}
          aria-pressed={stt.isListening || rec.recording}
          aria-label={stt.isListening || rec.recording ? 'Stop voice input' : 'Start voice input'}
          onClick={handleMicClick}
          title="Speak instead of typing"
        >
          🎤
        </button>
        {onOpenServiceForm && (
          <button
            type="button"
            className="btn"
            onClick={onOpenServiceForm}
            disabled={Boolean(disabled) || disableServiceButton}
          >
            Add service
          </button>
        )}
        <button className="btn primary" type="submit" disabled={disabled || !value.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}
