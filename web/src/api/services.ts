import type { Service } from '@/types/services';
import { VITE } from '@/utils/env';

export type SortKey = 'recent' | 'name';
type MaybeDateLike = { updatedAt?: string | number | Date };

function toEpoch(v: string | number | Date | undefined): number {
  if (v == null) return 0;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

const BASE = VITE.VITE_API_BASE_URL?.trim();

export async function fetchServices(): Promise<Service[]> {
  if (!BASE) {
    const url = '/mock/services.json';
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const t = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}: ${t.slice(0, 120)}`);
    assertJson(r, t, url);
    return JSON.parse(t) as Service[];
  }

  const url = `${BASE.replace(/\/$/, '')}/api/services`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}: ${t.slice(0, 120)}`);
  assertJson(r, t, url);
  return JSON.parse(t) as Service[];
}

function assertJson(r: Response, bodyPreview: string, url: string) {
  const ct = r.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) {
    const head = bodyPreview.trim().slice(0, 80);
    throw new Error(`Expected JSON from ${url}, got ${ct || 'unknown'}; first bytes: ${head}`);
  }
}

export function sortServices(items: Service[], key: SortKey): Service[] {
  if (key === 'recent') {
    return [...items].sort(
      (a, b) => toEpoch((b as MaybeDateLike).updatedAt) - toEpoch((a as MaybeDateLike).updatedAt)
    );
  }
  if (key === 'name') {
    return [...items].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' })
    );
  }
  return items;
}