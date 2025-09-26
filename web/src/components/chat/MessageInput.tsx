// web/src/components/chat/MessageInput.tsx
import { useState, FormEvent } from 'react';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
};

export default function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  }

  return (
    <form className="chat-input" onSubmit={submit} aria-label="Send a message">
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-input"
        placeholder="Type your message…"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <button className="btn primary" type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}