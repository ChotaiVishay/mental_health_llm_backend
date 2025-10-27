import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useMicRecorder } from '@/hooks/useMicRecorder';
import { useLanguage } from '@/i18n/LanguageProvider';
import ChatComposer from './ChatComposer';
import { sendAudioForTranscription } from '@/features/stt/sendAudio';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  maxVisibleLines?: number;
  isSending?: boolean;
};

const DEFAULT_MAX_VISIBLE_LINES = 5;

export default function MessageInput({ onSend, disabled, maxVisibleLines, isSending = false }: Props) {
  const [value, setValue] = useState('');
  const stt = useSpeechToText();           // Chrome path
  const rec = useMicRecorder();            // Fallback path
  const { t, locale, language, keyboard } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxLines = maxVisibleLines ?? DEFAULT_MAX_VISIBLE_LINES;
  const [sttUploadError, setSttUploadError] = useState<string | null>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el || typeof window === 'undefined') return;
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight || '20');
    const padding = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
    const border = parseFloat(styles.borderTopWidth || '0') + parseFloat(styles.borderBottomWidth || '0');
    el.style.height = 'auto';
    const maxHeight = lineHeight * maxLines + padding + border;
    const minHeight = lineHeight + padding + border;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(next, minHeight)}px`;
  }, [maxLines]);

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
  }, [resizeTextarea, value, stt.interim, stt.isListening, sttUploadError]);

  async function uploadAndInsert(blob: Blob) {
    setSttUploadError(null);
    try {
      const transcript = await sendAudioForTranscription(blob, language, locale);
      if (transcript) {
        setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      } else {
        setSttUploadError(t('chat.errors.generic'));
      }
    } catch (error) {
      console.error('STT upload failed', error);
      setSttUploadError(t('chat.errors.network'));
    }
  }

  async function handleMicClick() {
    const fatalSpeechErrors = new Set([
      'unsupported',
      'insecure',
      'blocked',
      'no-mic',
      'network',
      'lang-unsupported',
    ]);

    setSttUploadError(null);

    const canUseSpeechApi = stt.isSupported && !fatalSpeechErrors.has(stt.errorCode ?? '');

    if (canUseSpeechApi) {
      if (stt.isListening) {
        stt.stop();
        return;
      }

      const speechLocale = locale || (typeof navigator !== 'undefined' ? navigator.language || 'en-AU' : 'en-AU');
      const started = await stt.start(speechLocale);
      if (started) {
        return;
      }
      // Speech API failed immediately; fall through to recorder fallback
    }

    if (!rec.recording) {
      await rec.start();
      if (!rec.recording && rec.error) {
        setSttUploadError(rec.error);
      }
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

  const basePlaceholder = t('chat.composer.placeholder.default');
  let placeholder = basePlaceholder;
  if (stt.isSupported) {
    if (stt.isListening) placeholder = t('chat.composer.placeholder.listening');
    else placeholder = stt.error ?? basePlaceholder;
  } else if (rec.recording) {
    placeholder = t('chat.composer.placeholder.recording');
  } else if (rec.error) {
    placeholder = rec.error;
  } else if (sttUploadError) {
    placeholder = sttUploadError;
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
    <>
      <ChatComposer
        ref={textareaRef}
        value={displayValue}
        onChange={setValue}
        onSend={submit}
        disabled={disabled}
        placeholder={placeholder}
        showMic
        ariaLabel={t('chat.composer.label')}
        formLabel={t('chat.composer.aria')}
        onMicClick={handleMicClick}
        isMicActive={listening}
        loading={isSending}
        sendDisabled={!canSend}
        micLabelStart={t('chat.composer.mic.start')}
        micLabelStop={t('chat.composer.mic.stop')}
        sendAriaLabel={t('chat.composer.send')}
        lang={language}
      />
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
    </>
  );
}
