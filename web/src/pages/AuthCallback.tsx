// web/src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { getAndClearReturnTo } from '@/auth/storage';
import { parseCallbackAndStore } from '@/auth/client';

/**
 * Handles the OAuth redirect for regular users.
 * - Parses token/user from the URL if present (parseCallbackAndStore)
 * - Optionally lets AuthContext finalize any extra steps (finishAuth)
 * - Redirects to `state`/returnTo or home
 */
export default function AuthCallback() {
  const auth = useAuth() as unknown as { finishAuth?: () => Promise<void> };
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      // 1) Primary: parse the callback query, store token+user, and get `state` if provided
      let next: string | undefined;
      try {
        next = parseCallbackAndStore();
      } catch {
        // parse failed (e.g., not our callback format) — fall through to storage-based returnTo
      }

      // 2) If the auth context needs to do any side effects (e.g., refresh user)
      const maybeFinish = auth.finishAuth;
      if (typeof maybeFinish === 'function') {
        try {
          await maybeFinish();
        } catch {
          // Non-fatal for navigation; user will still be redirected
        }
      }

      // 3) Prefer `state` from callback; otherwise check local "returnTo"; else home
      const ret = next || getAndClearReturnTo() || '/';
      nav(ret, { replace: true });
    })();
  }, [nav]);

  return (
    <div aria-busy="true" role="status">
      Finishing sign-in…
    </div>
  );
}