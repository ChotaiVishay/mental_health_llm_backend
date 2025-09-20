// web/src/pages/Services.tsx
import { useEffect, useMemo, useState } from 'react';
import { fetchServices, sortServices, SortKey } from '@/api/services';
import type { Service } from '@/types/services';
import OrgBadge from '@/components/services/OrgBadge';
import Title from '@/components/misc/Title';

function norm(s?: string) {
  return (s ?? '').toLowerCase();
}

type ServiceExt = Service & {
  orgKind?: string;
  specialty?: string;
  suburb?: string;
  updatedAt?: string | number | Date;
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recently updated' },
  // If your sortServices supports more keys, add them here:
  // { key: 'name', label: 'Name (A–Z)' },
];

export default function Services() {
  const [all, setAll] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI state (search, simple type filter, sorting)
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
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
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(() => {
    const nq = norm(q);
    const nt = norm(type);

    const base = all.filter((s) => {
      const sx = s as ServiceExt;
      const matchesQ =
        !nq ||
        norm(sx.name).includes(nq) ||
        norm(sx.suburb).includes(nq) ||
        norm(sx.specialty).includes(nq);

      const matchesType = !nt || norm(sx.orgKind) === nt;
      return matchesQ && matchesType;
    });

    return sortServices(base, sortKey);
  }, [all, q, type, sortKey]);

  const resultsText =
    loading ? 'Loading services…' : err ? 'Failed to load services' : `${items.length} result${items.length === 1 ? '' : 's'}`;

  return (
    <>
      <Title value="Support Atlas — All Services" />

      <h1 className="h1" style={{ marginTop: 0 }}>
        All Services
      </h1>
      <p className="lead">
        Browse the directory. Use filters to refine. Information only — contact providers directly.
      </p>

      <div className="split" style={{ marginTop: 20 }}>
        {/* Left: Filters (sticky card) */}
        <aside className="filters" aria-label="Filters">
          <div className="field">
            <label htmlFor="f-q">Search</label>
            <input
              id="f-q"
              type="text"
              placeholder="Name, suburb, specialty"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="f-type">Type</label>
            <select id="f-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Any</option>
              {/* Match your dataset terms used in OrgBadge/kind */}
              <option value="psychologist">Psychologist</option>
              <option value="counsellor">Counsellor</option>
              <option value="gp">GP</option>
              <option value="peer support">Peer support</option>
              <option value="helpline">Helpline</option>
            </select>
          </div>

          {/* Keep other controls visible but disabled for now — matches prototype UI and sets expectation */}
          <div className="field advanced-only">
            <label htmlFor="f-fee">Fees</label>
            <select id="f-fee" disabled>
              <option>Any</option>
              <option>Free / Low-cost</option>
              <option>Bulk-bill (GP)</option>
              <option>Paid</option>
            </select>
          </div>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setQ('');
              setType('');
            }}
          >
            Clear filters
          </button>
        </aside>

        {/* Right: Results area */}
        <section aria-live="polite" aria-busy={loading}>
          {/* Top toolbar: results count + sort */}
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div id="results-summary" className="muted">
              {resultsText}
            </div>

            <div className="switch-row" role="group" aria-label="Sort options">
              <label htmlFor="f-sort" className="muted">
                Sort
              </label>
              <select
                id="f-sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-describedby="results-summary"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <div>Loading services…</div>}
          {err && (
            <div role="alert" style={{ color: '#B91C1C' }}>
              {err}
            </div>
          )}

          {!loading && !err && (
            <>
              {items.length === 0 ? (
                <div className="card" role="status">
                  <strong>No results.</strong>{' '}
                  <span className="muted">Try clearing filters or adjusting your search.</span>
                </div>
              ) : (
                <div className="card-grid">
                  {items.map((s) => {
                    const sx = s as ServiceExt;
                    const updated =
                      sx.updatedAt ? new Date(sx.updatedAt).toLocaleDateString() : '—';
                    const subtitle = [
                      sx.orgKind || 'Service',
                      sx.suburb ?? '—',
                      sx.specialty && sx.specialty,
                    ]
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <article className="card" key={s.id}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <h3 className="h3" style={{ margin: 0 }}>
                            {s.name}
                          </h3>
                          <OrgBadge kind={sx.orgKind} />
                        </header>

                        <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p>
                        <p style={{ marginTop: 8 }}>
                          <small className="muted">Last updated: {updated}</small>
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            marginTop: 8,
                          }}
                        >
                          <a className="btn btn-primary" href={`/services/${s.id}`}>
                            View details
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}