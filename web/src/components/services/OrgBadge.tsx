export default function OrgBadge({ kind }: { kind: 'private_clinic' | 'hospital' }) {
  const label = kind === 'private_clinic' ? 'Private Clinic' : 'Hospital';
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 12,
      padding: '2px 8px',
      border: '1px solid #E5E7EB',
      borderRadius: 999,
      background: '#F9FAFB'
    }}>{label}</span>
  );
}