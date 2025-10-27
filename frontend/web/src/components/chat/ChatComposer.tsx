import {
  forwardRef,
  FormEvent,
  KeyboardEvent,
  ReactNode,
} from 'react';
import { Loader2, Mic, MicOff, Send } from 'lucide-react';

type ChatComposerBaseProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  showMic?: boolean;
};

type OptionalProps = {
  ariaLabel?: string;
  onMicClick?: () => void;
  isMicActive?: boolean;
  loading?: boolean;
  leadingSlot?: ReactNode;
  trailingSlot?: ReactNode;
  sendDisabled?: boolean;
  micLabelStart?: string;
  micLabelStop?: string;
  sendAriaLabel?: string;
  lang?: string;
  formLabel?: string;
};

export type ChatComposerProps = ChatComposerBaseProps & OptionalProps;

const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>((props, ref) => {
  const {
    value,
    onChange,
    onSend,
    disabled = false,
    placeholder,
    showMic = false,
    ariaLabel,
    onMicClick,
    isMicActive = false,
    loading = false,
    leadingSlot,
    trailingSlot,
    sendDisabled,
    micLabelStart = 'Start voice input',
    micLabelStop = 'Stop voice input',
    sendAriaLabel = 'Send message',
    lang,
    formLabel,
  } = props;

  const computedSendDisabled = Boolean(disabled || sendDisabled || value.trim().length === 0);
  const micButton = showMic ? (
    <button
      type="button"
      className={isMicActive ? 'composer-icon-btn listening' : 'composer-icon-btn'}
      aria-pressed={isMicActive}
      aria-label={isMicActive ? micLabelStop : micLabelStart}
      title={isMicActive ? micLabelStop : micLabelStart}
      onClick={onMicClick}
      disabled={disabled}
      data-easy-mode="hide"
    >
      {isMicActive ? <MicOff aria-hidden /> : <Mic aria-hidden />}
    </button>
  ) : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (computedSendDisabled) return;
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (!computedSendDisabled) onSend();
    }
  };

  const formAria = formLabel ?? ariaLabel ?? 'Chat composer';

  return (
    <form className="chat-composer" onSubmit={handleSubmit} aria-label={formAria}>
      {leadingSlot}
      {micButton}
      <label htmlFor="chat-composer-input" className="sr-only">{ariaLabel ?? 'Message input'}</label>
      <textarea
        id="chat-composer-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Message input'}
        onKeyDown={handleKeyDown}
        lang={lang}
        data-testid="composer-input"
      />
      <button
        type="submit"
        className="composer-icon-btn send"
        disabled={computedSendDisabled}
        aria-label={sendAriaLabel}
        title={sendAriaLabel}
        data-testid="composer-send"
      >
        {loading ? <Loader2 className="spinner" aria-hidden /> : <Send aria-hidden />}
      </button>
      {trailingSlot}
    </form>
  );
});

ChatComposer.displayName = 'ChatComposer';

export default ChatComposer;
