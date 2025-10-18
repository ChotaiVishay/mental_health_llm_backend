import Title from '@/components/misc/Title';
import { useAuth } from '@/auth/AuthContext';

export default function AdminIndex() {
  const { user } = useAuth();
  const role = (user as any)?.role ?? 'viewer';

  return (
    <main style={{ padding: '24px 16px' }}>
      <Title value="Admin Console" />
      <h1 style={{ margin: '0 0 8px' }}>Admin Console</h1>
      <p className="muted">Signed in as: <strong>{user?.email ?? user?.name ?? user?.id}</strong> ({String(role)})</p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: '18px', marginBottom: 8 }}>Manage</h2>
        <ul>
          <li><a href="/admin/services">Services</a> — add, edit, or review service records</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: '18px', marginBottom: 8 }}>Your access</h2>
        <ul>
          <li>Role: <code>{String(role)}</code></li>
          <li>Org: <code>{String((user as any)?.org_id ?? '—')}</code></li>
        </ul>
      </section>
    </main>
  );
}
