import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseCallbackAndStore } from '@/auth/client';

export default function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    const dest = parseCallbackAndStore();
    nav(dest, { replace: true });
  }, [nav]);
  return <div aria-busy="true">Completing sign-in…</div>;
}