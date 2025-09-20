import { FormEvent, useRef, useState } from 'react';
import Button from '@/components/ui/Button';

export default function MessageInput({
  onSend,
  disabled
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [val, setVal] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = val.trim();
    if (!text) return;
    onSend(text);
    setVal('');
    ref.current?.focus();
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <label htmlFor="chat-input" style={{ position: 'absolute', left: -9999 }}>
        Message
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={3}
        placeholder="Type your message…"
        style={{ padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" type="submit" disabled={disabled || !val.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}