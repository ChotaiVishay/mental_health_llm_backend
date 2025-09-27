import { useEffect } from 'react';
import Title from '@/components/misc/Title';
import { ADMIN_CONSOLE_URL } from '@/config/admin';

export default function AdminIndex() {
  // Full-page navigation to Django Admin
  useEffect(() => {
    try {
      window.location.assign(ADMIN_CONSOLE_URL);
    } catch {
      // No-op: a11y fallback link below
    }
  }, []);

  return (
    <main style={{ padding: '24px 16px' }}>
      <Title value="Opening Admin Console…" />
      <h1 style={{ margin: '0 0 8px' }}>Opening Admin Console…</h1>
      <p>
        If you are not redirected automatically,&nbsp;
        <a href={ADMIN_CONSOLE_URL}>open Django Admin</a>.
      </p>
      <noscript>
        <p><strong>JavaScript is disabled.</strong>&nbsp;
          <a href={ADMIN_CONSOLE_URL}>Open Django Admin</a>
        </p>
      </noscript>
    </main>
  );
}