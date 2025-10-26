import DyslexicModeToggle from '@/components/accessibility/DyslexicModeToggle';
import EasyModeToggle from '@/components/accessibility/EasyModeToggle';
import HighContrastModeToggle from '@/components/accessibility/HighContrastModeToggle';
import ScreenReaderModeToggle from '@/components/accessibility/ScreenReaderModeToggle';
import LargeTextModeToggle from '@/components/accessibility/LargeTextModeToggle';
import ReducedMotionModeToggle from '@/components/accessibility/ReducedMotionModeToggle';
import Container from '@/components/layout/Container';
import Title from '@/components/misc/Title';
import { useLanguage, useTranslation } from '@/i18n/LanguageProvider';

export default function Accessibility() {
  const t = useTranslation();
  const { list } = useLanguage();

  const easyModePoints = list('accessibility.easyMode.points');
  const reducedMotionPoints = list('accessibility.reducedMotion.points');
  const largeTextPoints = list('accessibility.largeText.points');
  const dyslexicPoints = list('accessibility.dyslexic.points');
  const highContrastPoints = list('accessibility.highContrast.points');
  const screenReaderPoints = list('accessibility.screenReader.points');

  return (
    <Container as="section" className="accessibility-page">
      <Title value={t('accessibility.metaTitle')} />

      <header className="accessibility-page-header">
        <h1>{t('accessibility.heading')}</h1>
        <p>{t('accessibility.intro')}</p>
      </header>

      <nav className="accessibility-quick-links" aria-label={t('accessibility.nav.aria')}>
        <a href="#reduce-overwhelm">{t('accessibility.nav.reduce')}</a>
        <a href="#improve-readability">{t('accessibility.nav.readability')}</a>
        <a href="#boost-clarity">{t('accessibility.nav.clarity')}</a>
      </nav>

      <section id="reduce-overwhelm" className="accessibility-section">
        <header className="accessibility-section-header">
          <h2>{t('accessibility.section.reduce.title')}</h2>
          <p>{t('accessibility.section.reduce.body')}</p>
        </header>
        <div className="accessibility-grid">
          <article className="accessibility-card" aria-labelledby="easy-mode-heading">
            <header>
              <h3 id="easy-mode-heading">{t('accessibility.easyMode.title')}</h3>
              <p>{t('accessibility.easyMode.body')}</p>
            </header>
            <EasyModeToggle className="accessibility-toggle" />
            <ul>
              {easyModePoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <article className="accessibility-card" aria-labelledby="reduced-motion-heading">
            <header>
              <h3 id="reduced-motion-heading">{t('accessibility.reducedMotion.title')}</h3>
              <p>{t('accessibility.reducedMotion.body')}</p>
            </header>
            <ReducedMotionModeToggle className="accessibility-toggle" />
            <ul>
              {reducedMotionPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="improve-readability" className="accessibility-section">
        <header className="accessibility-section-header">
          <h2>{t('accessibility.section.readability.title')}</h2>
          <p>{t('accessibility.section.readability.body')}</p>
        </header>
        <div className="accessibility-grid">
          <article className="accessibility-card" aria-labelledby="large-text-heading">
            <header>
              <h3 id="large-text-heading">{t('accessibility.largeText.title')}</h3>
              <p>{t('accessibility.largeText.body')}</p>
            </header>
            <LargeTextModeToggle className="accessibility-toggle" />
            <ul>
              {largeTextPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <article className="accessibility-card" aria-labelledby="dyslexic-mode-heading">
            <header>
              <h3 id="dyslexic-mode-heading">{t('accessibility.dyslexic.title')}</h3>
              <p>{t('accessibility.dyslexic.body')}</p>
            </header>
            <DyslexicModeToggle className="accessibility-toggle" />
            <ul>
              {dyslexicPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="boost-clarity" className="accessibility-section">
        <header className="accessibility-section-header">
          <h2>{t('accessibility.section.clarity.title')}</h2>
          <p>{t('accessibility.section.clarity.body')}</p>
        </header>
        <div className="accessibility-grid">
          <article className="accessibility-card" aria-labelledby="high-contrast-heading">
            <header>
              <h3 id="high-contrast-heading">{t('accessibility.highContrast.title')}</h3>
              <p>{t('accessibility.highContrast.body')}</p>
            </header>
            <HighContrastModeToggle className="accessibility-toggle" />
            <ul>
              {highContrastPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <article className="accessibility-card" aria-labelledby="screen-reader-heading">
            <header>
              <h3 id="screen-reader-heading">{t('accessibility.screenReader.title')}</h3>
              <p>{t('accessibility.screenReader.body')}</p>
            </header>
            <ScreenReaderModeToggle className="accessibility-toggle" />
            <ul>
              {screenReaderPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </Container>
  );
}
