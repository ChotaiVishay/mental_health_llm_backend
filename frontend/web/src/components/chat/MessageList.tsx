import { memo } from 'react';

export type Message = { id: string; role: 'user' | 'assistant'; text: string };

export default memo(function MessageList({ items }: { items: Message[] }) {
  return (
    <div aria-live="polite" aria-label="Messages" style={{ display: 'grid', gap: 12 }}>
      {items.map((m) => (
        <div
          key={m.id}
          style={{
            alignSelf: m.role === 'user' ? 'end' : 'start',
            justifySelf: m.role === 'user' ? 'end' : 'start',
            maxWidth: 640,
            border: '1px solid #E5E7EB',
            background: m.role === 'user' ? '#EFF6FF' : '#FFFFFF',
            borderRadius: 10,
            padding: 12
          }}
        >
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
            {m.role === 'user' ? 'You' : 'Support Atlas Assistant'}
          </div>
          <div>{m.text}</div>
        </div>
      ))}
    </div>
  );
});