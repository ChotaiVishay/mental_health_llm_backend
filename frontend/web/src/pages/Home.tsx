import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Title from '@/components/misc/Title';
import Container from '@/components/layout/Container';
import { savePreloginChat } from '@/features/chat/sessionStore';
import { useLanguage, useTranslation } from '@/i18n/LanguageProvider';
import { scrollToHash } from '@/utils/scroll';
import '@/styles/pages/home.css';

export default function Home() {
  const nav = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const { language } = useLanguage();

  const start = (seed?: string) => {
    if (seed) {
      const now = Date.now();
      savePreloginChat({
        messages: [],
        pendingPrompt: { text: seed, createdAt: now },
      });
    }
    nav('/chat');
  };

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // Reveal-on-view only (removed horizontal scrollytelling)
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && (e.target as HTMLElement).classList.add('in')),
      { rootMargin: '0px 0px -15% 0px', threshold: 0.2 }
    );
    document.querySelectorAll<HTMLElement>('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (location.hash) {
      scrollToHash(location.hash);
    }
  }, [location.hash]);

  const prompts = useMemo(
    () => [
      { text: t('home.hero.prompt1.text'), aria: t('home.hero.prompt1.aria') },
      { text: t('home.hero.prompt2.text'), aria: t('home.hero.prompt2.aria') },
      { text: t('home.hero.prompt3.text'), aria: t('home.hero.prompt3.aria') },
      { text: t('home.hero.prompt4.text'), aria: t('home.hero.prompt4.aria') },
    ],
    [t, language],
  );

  const steps = useMemo(
    () => [
      { num: '1', title: t('home.how.step1.title'), body: t('home.how.step1.body') },
      { num: '2', title: t('home.how.step2.title'), body: t('home.how.step2.body') },
      { num: '3', title: t('home.how.step3.title'), body: t('home.how.step3.body') },
    ],
    [t, language],
  );

  const helpCards = useMemo(
    () => [
      { title: t('home.help.card1.title'), body: t('home.help.card1.body') },
      { title: t('home.help.card2.title'), body: t('home.help.card2.body') },
      { title: t('home.help.card3.title'), body: t('home.help.card3.body') },
    ],
    [t, language],
  );

  const principles = useMemo(
    () => [
      { title: t('home.principles.calm.title'), body: t('home.principles.calm.body') },
      { title: t('home.principles.trust.title'), body: t('home.principles.trust.body') },
      { title: t('home.principles.support.title'), body: t('home.principles.support.body') },
      { title: t('home.principles.inclusive.title'), body: t('home.principles.inclusive.body') },
    ],
    [t, language],
  );

  const faqItems = useMemo(
    () => [
      { question: t('home.faq.q1.question'), answer: t('home.faq.q1.answer') },
      { question: t('home.faq.q2.question'), answer: t('home.faq.q2.answer') },
      { question: t('home.faq.q3.question'), answer: t('home.faq.q3.answer') },
      { question: t('home.faq.q4.question'), answer: t('home.faq.q4.answer') },
      { question: t('home.faq.q5.question'), answer: t('home.faq.q5.answer') },
      {
        question: t('home.faq.q6.question'),
        answer: (
          <>
            {t('home.faq.q6.answer.part1')} <strong>000</strong>. {t('home.faq.q6.answer.part2')}
          </>
        ),
      },
    ],
    [t, language],
  );

  return (
    <div className="home">
      <Title value={t('home.metaTitle')} />

      {/* HERO */}
      <section id="top" className="edge hero hero-block">
        <Container>
          <header className="hero-head">
            <h1 className="hero-title reveal">{t('home.hero.title')}</h1>
            <p className="hero-sub reveal delay-1">{t('home.hero.subtitle')}</p>
          </header>

          <button
            type="button"
            className="cta-banner reveal delay-2"
            aria-describedby="cta-note"
            onClick={() => start()}
          >
            {t('home.hero.cta')}
          </button>

          <p id="cta-note" className="hero-note reveal delay-3" role="note">
            {t('home.hero.note')}
          </p>

          <div
            className="chips reveal delay-4"
            role="group"
            aria-label={t('home.hero.prompts.aria')}
          >
            {prompts.map(prompt => (
              <button
                key={prompt.text}
                type="button"
                className="chip"
                aria-label={prompt.aria}
                onClick={() => start(prompt.text)}
              >
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Updated order to match new section order */}
          <nav className="hero-links reveal delay-5" aria-label={t('home.hero.nav.aria')}>
            <a href="#how">{t('home.hero.nav.how')}</a>
            <a href="#help-crisis">{t('home.hero.nav.help')}</a>
            <a href="#principles">{t('home.hero.nav.principles')}</a>
            <a href="#faq">{t('home.hero.nav.faq')}</a>
          </nav>
        </Container>
      </section>

      {/* HOW IT WORKS — 2-col + decorative brand SVG */}
      <section id="how" className="edge section pattern-a hero-block">
        <Container>
          <div className="how-grid">
            <div className="how-copy">
              <header className="section-head reveal">
                <h2 className="h1">{t('home.how.title')}</h2>
                <p className="muted">{t('home.how.subtitle')}</p>
              </header>

              <ol className="steps reveal delay-1">
                {steps.map(step => (
                  <li key={step.num}>
                    <div className="step-num">{step.num}</div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Decorative inline "leaf badges" */}
            <div className="how-media reveal delay-2" aria-hidden="true">
              <svg className="how-svg" viewBox="0 0 480 360" role="img" aria-label="">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0" stopColor="#276D57" stopOpacity="0.14" />
                    <stop offset="1" stopColor="#3E9C7C" stopOpacity="0.26" />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="1">
                    <stop offset="0" stopColor="#85C9B0" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#B0DFCC" stopOpacity="0.28" />
                  </linearGradient>
                </defs>
                <path d="M30,220 C110,140 210,200 280,140 C340,90 420,120 450,90 L450,330 L30,330 Z" fill="url(#g1)" />
                <path d="M30,250 C120,220 220,290 300,230 C360,185 410,210 450,180 L450,330 L30,330 Z" fill="url(#g2)" />
                <g transform="translate(120,110)">
                  <circle r="48" fill="#D6EFE5" />
                  <circle r="48" fill="none" stroke="#85C9B0" strokeWidth="2" />
                  <path d="M-10,6 C-6,-8 8,-18 20,-10 C32,-2 10,20 -8,24" fill="none" stroke="#2F8468" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M-4,10 C2,2 12,-2 16,4" fill="none" stroke="#648046" strokeWidth="3" strokeLinecap="round"/>
                </g>
                <g transform="translate(330,80)">
                  <rect x="-58" y="-38" rx="18" ry="18" width="116" height="76" fill="#E9F8F1" stroke="#B0DFCC" />
                  <path d="M-28,0 h56" stroke="#2F8468" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M-18,-10 h36" stroke="#648046" strokeWidth="3" strokeLinecap="round" opacity=".85"/>
                  <path d="M-20,10 h40" stroke="#3E9C7C" strokeWidth="3" strokeLinecap="round" opacity=".9"/>
                </g>
                <g transform="translate(340,190)">
                  <circle r="38" fill="#E9F8F1" />
                  <circle r="38" fill="none" stroke="#B0DFCC" strokeWidth="2" />
                  <path d="M-12,6 q10,-22 30,-12 q-6,18 -24,22" fill="#60B596" opacity=".9"/>
                </g>
              </svg>
            </div>
          </div>
        </Container>
      </section>

      {/* HELP & CRISIS (moved above principles) */}
      <section id="help-crisis" className="edge section pattern-crisis hero-block" aria-labelledby="help-title">
        <Container>
          <header className="section-head reveal">
            <h2 id="help-title" className="h1">{t('home.help.title')}</h2>
          </header>

          <aside className="crisis-banner reveal delay-1" role="note" aria-live="polite">
            <strong>{t('home.help.banner')}</strong>
          </aside>

          <div
            className="hotlines reveal delay-2"
            role="group"
            aria-label={t('home.help.hotline.aria')}
          >
            <a className="hotline" href="tel:131114" aria-label={t('home.help.hotline.lifeline.aria')}>
              <h3>{t('home.help.hotline.lifeline.name')}</h3>
              <p className="phone">13 11 14</p>
              <span className="tag">{t('home.help.hotline.tag')}</span>
            </a>
            <a className="hotline" href="tel:1800551800" aria-label={t('home.help.hotline.kids.aria')}>
              <h3>{t('home.help.hotline.kids.name')}</h3>
              <p className="phone">1800 55 1800</p>
              <span className="tag">{t('home.help.hotline.tag')}</span>
            </a>
            <a className="hotline" href="tel:1300224636" aria-label={t('home.help.hotline.beyond.aria')}>
              <h3>{t('home.help.hotline.beyond.name')}</h3>
              <p className="phone">1300 22 4636</p>
              <span className="tag">{t('home.help.hotline.tag')}</span>
            </a>
          </div>

          <div className="grid grid-3 reveal delay-3">
            {helpCards.map(card => (
              <div className="card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            ))}
          </div>

          <div className="cta-row reveal delay-4">
            <button className="btn btn-primary" onClick={() => start()}>
              {t('home.help.cta')}
            </button>
          </div>
        </Container>
      </section>

      {/* OUR PRINCIPLES — static large cards */}
      <section id="principles" className="edge section hero-block" aria-labelledby="principles-title">
        <Container>
          <header className="section-head reveal">
            <h2 id="principles-title" className="h1">{t('home.principles.title')}</h2>
          </header>

          <div className="p-grid reveal delay-1" role="group" aria-label={t('home.principles.aria')}>
            {principles.map(card => (
              <article className="p-card" key={card.title}>
                <header>
                  <span className="p-dot" aria-hidden="true" />
                  {card.title}
                </header>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ — minimal accordion */}
      <section id="faq" className="edge section pattern-faq hero-block" aria-labelledby="faq-title">
        <Container>
          <header className="section-head reveal">
            <h2 id="faq-title" className="h1">{t('home.faq.title')}</h2>
            <p className="muted">{t('home.faq.subtitle')}</p>
          </header>

          <div className="faq-list">
            {faqItems.map((item, idx) => (
              <details className={`faq-min reveal${idx ? ` delay-${idx}` : ''}`} key={item.question}>
                <summary>{item.question}</summary>
                <div>{item.answer}</div>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
