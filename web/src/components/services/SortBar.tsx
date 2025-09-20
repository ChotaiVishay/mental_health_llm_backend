import { SortKey } from '@/api/services';

export default function SortBar({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
      <label htmlFor="sort">Sort</label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        style={{ padding: 8, borderRadius: 8, border: '1px solid #E5E7EB' }}
      >
        <option value="recent">Recently Added</option>
        <option value="name">A–Z</option>
      </select>
    </div>
  );
}