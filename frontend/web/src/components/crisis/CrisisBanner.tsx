import type { CSSProperties } from 'react';
import { useTranslation } from '@/i18n/LanguageProvider';

const linkStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  background: 'white',
  color: '#111827',
  borderRadius: 10,
  padding: '10px 12px',
  textDecoration: 'none',
};

const tagStyle: CSSProperties = { display: 'block', fontSize: 12, color: '#6B7280' };

export default function CrisisBanner() {
  const t = useTranslation();

  return (
    <section
      aria-label={t('crisis.banner.aria')}
      style={{
        background: '#B91C1C',
        color: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        marginBottom: 20,
      }}
    >
      <div aria-hidden="true" style={{ fontSize: 28, marginBottom: 6 }}>⚠️</div>
      <h1 style={{ margin: '6px 0 8px 0' }}>{t('crisis.banner.title')}</h1>
      <p style={{ marginTop: 0 }}>{t('crisis.banner.body')}</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        <a href="tel:000" className="btn" style={linkStyle}>
          <span aria-hidden="true">📞</span>
          <span>
            <span style={tagStyle}>{t('crisis.banner.emergency.tag')}</span>
            <strong>000</strong>
          </span>
        </a>

        <a href="tel:131114" className="btn" style={linkStyle}>
          <span aria-hidden="true">📞</span>
          <span>
            <span style={tagStyle}>{t('crisis.banner.lifeline.tag')}</span>
            <strong>13 11 14</strong>
          </span>
        </a>

        <a href="tel:1800551800" className="btn" style={linkStyle}>
          <span aria-hidden="true">👶</span>
          <span>
            <span style={tagStyle}>{t('crisis.banner.kids.tag')}</span>
            <strong>1800 55 1800</strong>
          </span>
        </a>

        <a href="tel:1300224636" className="btn" style={linkStyle}>
          <span aria-hidden="true">💬</span>
          <span>
            <span style={tagStyle}>{t('crisis.banner.beyond.tag')}</span>
            <strong>1300 22 4636</strong>
          </span>
        </a>
      </div>
    </section>
  );
}
