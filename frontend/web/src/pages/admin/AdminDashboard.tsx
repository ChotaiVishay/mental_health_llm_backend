import { useEffect, useState } from 'react';
import { listProviders, listServices, listUsers } from '@/api/admin';
import { useAdminAuth } from '@/admin/AdminAuthContext';

type Summary = {
  users: number;
  providers: number;
  services: number;
  pendingProviders: number;
  pendingServices: number;
};

const initialSummary: Summary = {
  users: 0,
  providers: 0,
  services: 0,
  pendingProviders: 0,
  pendingServices: 0,
};

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [users, providers, services, pendingProviders, pendingServices] = await Promise.all([
          listUsers({ page_size: 1 }),
          listProviders({ page_size: 1 }),
          listServices({ page_size: 1 }),
          listProviders({ status: 'pending', page_size: 1 }),
          listServices({ status: 'pending', page_size: 1 }),
        ]);

        if (cancelled) return;
        setSummary({
          users: users.count,
          providers: providers.count,
          services: services.count,
          pendingProviders: pendingProviders.count,
          pendingServices: pendingServices.count,
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load summary');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Welcome back, {admin?.first_name || admin?.username}</h1>
        <p className="muted">Use the navigation to manage users, services, and providers.</p>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="admin-stat-grid">
        <StatCard label="Total users" value={summary.users} loading={loading} />
        <StatCard label="Total providers" value={summary.providers} loading={loading} />
        <StatCard label="Pending providers" value={summary.pendingProviders} loading={loading} tone="warning" />
        <StatCard label="Total services" value={summary.services} loading={loading} />
        <StatCard label="Pending services" value={summary.pendingServices} loading={loading} tone="warning" />
      </div>
    </div>
  );
}

type StatCardProps = { label: string; value: number; loading?: boolean; tone?: 'default' | 'warning' };

function StatCard({ label, value, loading, tone = 'default' }: StatCardProps) {
  return (
    <article className={`admin-stat-card ${tone}`}>
      <span className="label">{label}</span>
      <span className="value">{loading ? '…' : value}</span>
    </article>
  );
}
