import Container from './Container';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageProvider';

type CtaKey = 'footer.cta.startChat' | 'footer.cta.viewServices' | 'footer.cta.helpCrisis';

type CtaBtn = { key: CtaKey; href: string; variant: 'primary' | 'secondary' };

function getCtas(path: string): CtaBtn[] {
  // normalize (no trailing slash)
  const p = path.replace(/\/+$/, '') || '/';

  if (p === '/chat') {
    // Already in chat: push people to services or crisis help
    return [
      { key: 'footer.cta.viewServices', href: '/services', variant: 'primary' },
      { key: 'footer.cta.helpCrisis', href: '/help', variant: 'secondary' },
    ];
  }

  if (p === '/help') {
    return [
      { key: 'footer.cta.startChat', href: '/chat', variant: 'primary' },
      { key: 'footer.cta.viewServices', href: '/services', variant: 'secondary' },
    ];
  }

  // Any services route (list or detail)
  if (p === '/services' || p.startsWith('/services/')) {
    return [
      { key: 'footer.cta.startChat', href: '/chat', variant: 'primary' },
      { key: 'footer.cta.helpCrisis', href: '/help', variant: 'secondary' },
    ];
  }

  // Default (home & misc)
  return [
    { key: 'footer.cta.startChat', href: '/chat', variant: 'primary' },
    { key: 'footer.cta.viewServices', href: '/services', variant: 'secondary' },
  ];
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const t = useTranslation();
  const ctas = getCtas(pathname);

  return (
    <footer className="footer" role="contentinfo">
      <Container>
        {/* CTA band */}
        {ctas.length > 0 && (
          <section className="footer-cta" aria-labelledby="cta-title">
            <div className="cta-copy">
              <h2 id="cta-title" className="cta-title">{t('footer.cta.title')}</h2>
              <p className="cta-sub">{t('footer.cta.subtitle')}</p>
              <ul className="cta-bullets" aria-hidden="true" data-easy-mode="hide">
                <li>{t('footer.cta.bulletPrivate')}</li>
                <li>{t('footer.cta.bulletFast')}</li>
                <li>{t('footer.cta.bulletNoAccount')}</li>
              </ul>
            </div>

            <div className="cta-actions">
              {ctas.map((b) => (
                <a
                  key={b.key}
                  className={`btn ${b.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
                  href={b.href}
                  data-easy-mode={b.variant === 'primary' ? 'priority' : 'hide'}
                >
                  {t(b.key)}
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
              {t('footer.tagline')}
            </p>
          </div>

          <div className="footer-links" role="navigation" aria-label="Footer">
            <nav aria-label={t('footer.heading.explore')}>
              <h3 className="footer-heading">{t('footer.heading.explore')}</h3>
              <ul className="footer-list">
                <li><a href="/">{t('header.nav.home')}</a></li>
                <li><a href="/chat">{t('header.nav.chat')}</a></li>
                <li><a href="/services">{t('header.nav.services')}</a></li>
                <li><a href="/help">{t('header.nav.helpCrisis')}</a></li>
              </ul>
            </nav>

            <nav aria-label={t('footer.heading.more')} data-easy-mode="hide">
              <h3 className="footer-heading">{t('footer.heading.more')}</h3>
              <ul className="footer-list">
                <li><a href="/admin">{t('footer.more.admin')}</a></li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="footer-disclaimer" role="note">
          <span>{t('footer.disclaimer.line1')}</span>{' '}
          <span>{t('footer.disclaimer.line2')}</span>{' '}
          <span>{t('footer.disclaimer.line3', { emergency: '000' })}</span>{' '}
          <span>
            {t('footer.disclaimer.line4')}{' '}
            <a href="/help">{t('footer.disclaimer.helpLink')}</a>.
          </span>
        </p>

        {/* Thin legal bar */}
        <div className="footer-legal">
          <span>© {year} Support Atlas</span>
          <nav aria-label={t('footer.heading.legal')} className="legal-links">
            <a href="/privacy">{t('footer.legal.privacy')}</a>
            <a href="/terms">{t('footer.legal.terms')}</a>
            <a href="/accessibility">{t('footer.legal.accessibility')}</a>
            <a href="/contact">{t('footer.legal.contact')}</a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
