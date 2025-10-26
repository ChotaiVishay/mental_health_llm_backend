import {
  useState,
  FormEvent,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useMicRecorder } from '@/hooks/useMicRecorder';
import { useLanguage } from '@/i18n/LanguageProvider';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
};

const MAX_VISIBLE_LINES = 5;

export default function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const stt = useSpeechToText();           // Chrome path
  const rec = useMicRecorder();            // Fallback path
  const { t, locale, language, keyboard } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el || typeof window === 'undefined') return;
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight || '20');
    const padding = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
    const border = parseFloat(styles.borderTopWidth || '0') + parseFloat(styles.borderBottomWidth || '0');
    el.style.height = 'auto';
    const maxHeight = lineHeight * MAX_VISIBLE_LINES + padding + border;
    const minHeight = lineHeight + padding + border;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(next, minHeight)}px`;
  }, []);

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

  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea, value, stt.interim, stt.isListening]);

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
  const currentText = value.trim();
  const canSend = currentText.length > 0 && !disabled;

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled, onSend, value]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      submit();
    }
  };

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
    textareaRef.current?.focus();
  };

  const displayValue = stt.isSupported && stt.isListening && stt.interim ? stt.interim : value;
  const listening = stt.isListening || rec.recording;

  return (
    <form className="chat-input" onSubmit={handleSubmit} aria-label={t('chat.composer.aria')}>
      <label htmlFor="chat-input" className="sr-only">{t('chat.composer.label')}</label>
      <button
        type="button"
        className={listening ? 'composer-icon-btn listening' : 'composer-icon-btn'}
        aria-pressed={listening}
        aria-label={listening ? t('chat.composer.mic.stop') : t('chat.composer.mic.start')}
        onClick={handleMicClick}
        title={t('chat.composer.mic.tooltip')}
        disabled={disabled}
        data-easy-mode="hide"
      >
        {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
      </button>
      <textarea
        id="chat-input"
        ref={textareaRef}
        rows={1}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        lang={language}
        aria-label={t('chat.composer.label')}
        onKeyDown={handleKeyDown}
      />
      <button
        className="composer-icon-btn send"
        type="submit"
        disabled={!canSend}
        aria-label={t('chat.composer.send')}
      >
        <Send aria-hidden />
      </button>
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
