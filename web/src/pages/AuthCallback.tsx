import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { getAndClearReturnTo } from '@/auth/storage';
import { parseCallbackAndStore } from '@/auth/client';

/**
 * Handles OAuth redirect for **regular users**.
 * - Parses token/user from callback URL (if present)
 * - Lets AuthContext finish any extra steps (finishAuth)
 * - Redirects to `state`/returnTo or home
 */
export default function AuthCallback() {
  const { finishAuth } = useAuth() as { finishAuth?: () => Promise<void> };
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      let next: string | undefined;

      // 1) Parse callback if this URL contains OAuth params (no-op otherwise)
      try {
        next = parseCallbackAndStore();
      } catch {
        // not our callback – ignore
      }

      // 2) Let context do any finalisation (optional)
      if (typeof finishAuth === 'function') {
        try {
          await finishAuth();
        } catch {
          // non-fatal – continue redirect
        }
      }

      // 3) Redirect to the intended page or home
      const ret = next || getAndClearReturnTo() || '/';
      nav(ret, { replace: true });
    })();
  }, [finishAuth, nav]);

  return (
    <div aria-busy="true" role="status" className="p-6">
      Finishing sign-in…
    </div>
  );
}