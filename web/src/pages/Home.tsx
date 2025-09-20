import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import SupportedLangNote from '@/components/misc/SupportedLangNote';
import Title from '@/components/misc/Title';

import { useAuth } from '@/auth/AuthContext';
import { setReturnTo } from '@/auth/storage';
import { savePreloginChat } from '@/features/chat/sessionStore';

export default function Home() {
  const nav = useNavigate();
  const { user, signInWith } = useAuth() as {
    user: unknown;
    // adapt to your auth client; `signInWith('google')` is a placeholder
    signInWith?: (provider: string) => Promise<void>;
  };

  // Optional first message the user may type before logging in.
  const [draft, setDraft] = useState('');

  async function onStartChat() {
    // If the user isn't authenticated yet, cache their first message (optional)
    // and remember where to send them after authentication.
    if (!user) {
      const text = draft.trim();
      if (text) {
        savePreloginChat({
          messages: [
            { id: crypto.randomUUID(), role: 'user', text, at: Date.now() }
          ]
        });
      }

      // Remember to return to /chat after auth completes
      setReturnTo('/chat');

      // Kick off your sign-in flow. If your AuthContext uses a different
      // method or provider, replace this line accordingly.
      if (typeof signInWith === 'function') {
        await signInWith('google');
      } else {
        // Fallback: navigate to a generic sign-in route if you have one.
        // Adjust to your project’s actual sign-in path.
        nav('/admin/signin');
      }
      return;
    }

    // Already signed in → go straight to chat
    nav('/chat');
  }

  return (
    <>
      <Title value="Support Atlas Assistant — Home" />
      <h1 style={{ marginTop: 0 }}>Support Atlas Assistant</h1>
      <p style={{ color: '#6B7280', maxWidth: 720 }}>
        Chat with our assistant to find mental health services and answers fast.
      </p>

      <Card>
        <h2 style={{ marginTop: 0 }}>Start a conversation</h2>
        <p style={{ color: '#6B7280' }}>
          You’ll be asked to sign in before chatting if you’re not already logged in.
        </p>

        {/* Optional “first message” draft that we cache pre-login */}
        <label htmlFor="first-msg" style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>
          First message (optional)
        </label>
        <textarea
          id="first-msg"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. I’m looking for a clinic near Melbourne…"
          rows={3}
          style={{
            width: '100%',
            maxWidth: 720,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            marginBottom: 12
          }}
        />

        <Button variant="primary" onClick={onStartChat}>Start Chat</Button>
        <SupportedLangNote />
      </Card>
    </>
  );
}