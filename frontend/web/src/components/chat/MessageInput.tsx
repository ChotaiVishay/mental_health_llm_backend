import { useState, FormEvent, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useMicRecorder } from '@/hooks/useMicRecorder';
import { useLanguage } from '@/i18n/LanguageProvider';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
};

export default function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const stt = useSpeechToText();           // Chrome path
  const rec = useMicRecorder();            // Fallback path
  const { t, locale, language, keyboard } = useLanguage();

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
      else {
        const speechLocale = locale || (typeof navigator !== 'undefined' ? navigator.language || 'en-AU' : 'en-AU');
        stt.start(speechLocale);
      }
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

  const basePlaceholder = t('chat.composer.placeholder.default');
  let placeholder = basePlaceholder;
  if (stt.isSupported) {
    if (stt.isListening) placeholder = t('chat.composer.placeholder.listening');
    else placeholder = stt.error ?? basePlaceholder;
  } else if (rec.recording) {
    placeholder = t('chat.composer.placeholder.recording');
  } else if (rec.error) {
    placeholder = rec.error;
  }

  const keyboardChars = keyboard.filter((char) => char.trim().length > 0);
  const showKeyboard = language !== 'en' && keyboardChars.length > 0;

  const appendCharacter = (char: string) => {
    setValue((prev) => `${prev}${char}`);
  };

  return (
    <form className="chat-input" onSubmit={submit} aria-label={t('chat.composer.aria')}>
      <label htmlFor="chat-input" className="sr-only">{t('chat.composer.label')}</label>
      <textarea
        id="chat-input"
        rows={2}
        placeholder={placeholder}
        value={stt.isSupported && stt.isListening && stt.interim ? stt.interim : value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        lang={language}
        aria-label={t('chat.composer.label')}
      />
      <div className="composer-actions" role="group" aria-label="Composer actions">
        <button
          type="button"
          className={`btn ${stt.isListening || rec.recording ? 'listening' : ''}`}
          aria-pressed={stt.isListening || rec.recording}
          aria-label={stt.isListening || rec.recording ? t('chat.composer.mic.stop') : t('chat.composer.mic.start')}
          onClick={handleMicClick}
          title={t('chat.composer.mic.tooltip')}
          data-easy-mode="hide"
        >
          🎤
        </button>
        <button className="btn primary" type="submit" disabled={disabled || !value.trim()}>
          {t('chat.composer.send')}
        </button>
      </div>
      {showKeyboard && (
        <div className="virtual-keyboard" aria-label={t('chat.keyboard.title')}>
          <p className="virtual-keyboard-hint">{t('chat.keyboard.hint')}</p>
          <div className="virtual-keyboard-keys">
            {keyboardChars.map((char) => (
              <button
                key={char}
                type="button"
                className="vk-key"
                onClick={() => appendCharacter(char)}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
