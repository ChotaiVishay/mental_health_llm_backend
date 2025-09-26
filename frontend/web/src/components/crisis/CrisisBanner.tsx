export default function CrisisBanner() {
  // AU emergency contacts per design reference
  // Emergency: 000, Lifeline: 13 11 14, Kids Helpline: 1800 55 1800, Beyond Blue: 1300 22 4636
  return (
    <section
      aria-label="Crisis support"
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
      <h1 style={{ margin: '6px 0 8px 0' }}>Need help right now?</h1>
      <p style={{ marginTop: 0 }}>
        If you’re in immediate danger or having thoughts of self-harm, please reach out for help immediately.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        <a
          href="tel:000"
          className="btn"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: 'white',
            color: '#111827',
            borderRadius: 10,
            padding: '10px 12px',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true">📞</span>
          <span>
            <span style={{ display: 'block', fontSize: 12, color: '#6B7280' }}>Emergency</span>
            <strong>000</strong>
          </span>
        </a>

        <a
          href="tel:131114"
          className="btn"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: 'white',
            color: '#111827',
            borderRadius: 10,
            padding: '10px 12px',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true">📞</span>
          <span>
            <span style={{ display: 'block', fontSize: 12, color: '#6B7280' }}>Lifeline</span>
            <strong>13 11 14</strong>
          </span>
        </a>

        <a
          href="tel:1800551800"
          className="btn"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: 'white',
            color: '#111827',
            borderRadius: 10,
            padding: '10px 12px',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true">👶</span>
          <span>
            <span style={{ display: 'block', fontSize: 12, color: '#6B7280' }}>Kids Helpline</span>
            <strong>1800 55 1800</strong>
          </span>
        </a>

        <a
          href="tel:1300224636"
          className="btn"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: 'white',
            color: '#111827',
            borderRadius: 10,
            padding: '10px 12px',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true">💬</span>
          <span>
            <span style={{ display: 'block', fontSize: 12, color: '#6B7280' }}>Beyond Blue</span>
            <strong>1300 22 4636</strong>
          </span>
        </a>
      </div>
    </section>
  );
}