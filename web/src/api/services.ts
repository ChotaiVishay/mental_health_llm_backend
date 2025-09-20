import type { Service } from '@/types/services';

// helper: stable compare
const by = <T>(sel: (x: T) => string | number, dir: 'asc' | 'desc' = 'asc') =>
  (a: T, b: T) => {
    const av = sel(a); const bv = sel(b);
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  };

export type SortKey = 'recent' | 'name';

export function sortServices(items: Service[], key: SortKey): Service[] {
  const copy = [...items];
  if (key === 'name') return copy.sort(by<Service>(s => s.name.toLowerCase(), 'asc'));
  // default: recent first
  return copy.sort(by<Service>(s => new Date(s.createdAt).getTime(), 'desc'));
}

export async function fetchServices(): Promise<Service[]> {
  const useMock = import.meta.env.VITE_SERVICES_MOCK === '1';
  if (useMock) {
    const data = (await import('@/mocks/services.json')).default as Service[];
    return data;
  }
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const res = await fetch(`${base}/v1/services`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load services (${res.status})`);
  const json = await res.json();
  return json as Service[];
}