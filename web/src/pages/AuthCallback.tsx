// web/src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseCallbackAndStore } from '@/auth/client';

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    // Reads token/name/email/state from URL, stores auth, returns `state` or '/'
    const next = parseCallbackAndStore();
    // After storing auth, send the user to where they were going (e.g. /chat)
    nav(next || '/', { replace: true });
  }, [nav]);

  return (
    <div aria-busy="true" role="status">
      Finishing sign-in…
    </div>
  );
}