// src/pages/Services.tsx
import { useEffect, useMemo, useState } from 'react';
import { fetchServices, sortServices, SortKey } from '@/api/services';
import type { Service } from '@/types/services';
import Grid from '@/components/layout/Grid';
import Card from '@/components/ui/Card';
import OrgBadge from '@/components/services/OrgBadge';
// ✅ add this:
import SortBar from '@/components/services/SortBar';

export default function Services() {
  const [all, setAll] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchServices();
        if (!alive) return;
        setAll(data);
      } catch (e: unknown) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Failed to load services';
        setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const items = useMemo(() => sortServices(all, sortKey), [all, sortKey]);

  return (
    <>
      <h1>Services</h1>
      <p style={{ color: '#6B7280' }}>
        Unified list of services. Default shows everything. Use sort to change order.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div />
        <SortControls value={sortKey} onChange={setSortKey} />
      </div>

      {loading && <div aria-busy="true">Loading services…</div>}
      {err && <div role="alert" style={{ color: '#B91C1C' }}>{err}</div>}

      {!loading && !err && (
        <Grid cols={3}>
          {items.map(s => (
            <Card key={s.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{s.name}</strong>
                <OrgBadge kind={s.orgKind} />
              </div>
              <div style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
                {s.suburb ? s.suburb : '—'} {s.specialty ? `• ${s.specialty}` : ''}
              </div>
            </Card>
          ))}
        </Grid>
      )}
    </>
  );
}

function SortControls({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return <SortBar value={value} onChange={onChange} />;
}