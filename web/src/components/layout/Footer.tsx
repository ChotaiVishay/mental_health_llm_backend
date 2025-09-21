import Container from './Container';
import { useLocation } from 'react-router-dom';

type CtaBtn = { label: string; href: string; variant: 'primary' | 'secondary' };

function getCtas(path: string): CtaBtn[] {
  // normalize (no trailing slash)
  const p = path.replace(/\/+$/, '') || '/';

  if (p === '/chat') {
    // Already in chat: push people to services or crisis help
    return [
      { label: 'View all services', href: '/services', variant: 'primary' },
      { label: 'Help & Crisis', href: '/help', variant: 'secondary' },
    ];
  }

  if (p === '/help') {
    return [
      { label: 'Start chat', href: '/chat', variant: 'primary' },
      { label: 'View all services', href: '/services', variant: 'secondary' },
    ];
  }

  // Any services route (list or detail)
  if (p === '/services' || p.startsWith('/services/')) {
    return [
      { label: 'Start chat', href: '/chat', variant: 'primary' },
      { label: 'Help & Crisis', href: '/help', variant: 'secondary' },
    ];
  }

  // Default (home & misc)
  return [
    { label: 'Start chat', href: '/chat', variant: 'primary' },
    { label: 'View all services', href: '/services', variant: 'secondary' },
  ];
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const ctas = getCtas(pathname);

  return (
    <footer className="footer" role="contentinfo">
      <Container>
        {/* CTA band */}
        {ctas.length > 0 && (
          <section className="footer-cta" aria-labelledby="cta-title">
            <div className="cta-copy">
              <h2 id="cta-title" className="cta-title">Get support in minutes.</h2>
              <p className="cta-sub">Chat with our assistant or explore services near you — free.</p>
              <ul className="cta-bullets" aria-hidden="true">
                <li>✓ Private</li>
                <li>✓ Quick to start</li>
                <li>✓ No sign-in required</li>
              </ul>
            </div>

            <div className="cta-actions">
              {ctas.map((b) => (
                <a
                  key={b.label}
                  className={`btn ${b.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
                  href={b.href}
                >
                  {b.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Brand + links */}
        <div className="footer-cols">
          <div className="footer-brand">
            <a className="brand" href="/" aria-label="Support Atlas home">
              <span className="logo" aria-hidden>SA</span>
              <span className="brand-name">Support Atlas</span>
            </a>
            <p className="footer-tagline small muted">
              Connecting you with mental-health services.
            </p>
          </div>

          <div className="footer-links" role="navigation" aria-label="Footer">
            <nav aria-label="Explore">
              <h3 className="footer-heading">Explore</h3>
              <ul className="footer-list">
                <li><a href="/">Home</a></li>
                <li><a href="/chat">Chat</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="/help">Help &amp; Crisis</a></li>
              </ul>
            </nav>

            <nav aria-label="More">
              <h3 className="footer-heading">More</h3>
              <ul className="footer-list">
                <li><a href="/admin">Admin</a></li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="footer-disclaimer" role="note">
          Information only — Support Atlas helps you find and connect with services. We don’t provide
          clinical, crisis, or legal advice. If you’re in danger call <strong>000</strong>. For immediate
          support, see <a href="/help">Help &amp; Crisis</a>.
        </p>

        {/* Thin legal bar */}
        <div className="footer-legal">
          <span>© {year} Support Atlas</span>
          <nav aria-label="Legal" className="legal-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/accessibility">Accessibility</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}