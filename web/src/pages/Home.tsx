import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '@/components/misc/Title';
import Container from '@/components/layout/Container';
import { savePreloginChat } from '@/features/chat/sessionStore';
import '@/styles/pages/home.css';

export default function Home() {
  const nav = useNavigate();

  const start = (seed?: string) => {
    if (seed) {
      const now = Date.now();
      savePreloginChat({
        messages: [{ id: `u_${now}`, role: 'user', text: seed, at: now }],
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

  return (
    <div className="home">
      <Title value="Support Atlas — Find support fast" />

      {/* HERO */}
      <section id="top" className="edge hero hero-block">
        <Container>
          <header className="hero-head">
            <h1 className="hero-title reveal">Find mental-health support, fast.</h1>
            <p className="hero-sub reveal delay-1">
              Browse trusted information about services or ask the assistant. Anonymous by default —
              sign in later to save your history.
            </p>
          </header>

          <button
            type="button"
            className="cta-banner reveal delay-2"
            aria-describedby="cta-note"
            onClick={() => start()}
          >
            Start chat — no sign-in required
          </button>

          <p id="cta-note" className="hero-note reveal delay-3" role="note">
            We’re an information directory. We don’t provide medical advice, diagnosis, referrals, or
            endorsements. Verify details directly with providers.
          </p>

          <div className="chips reveal delay-4" role="group" aria-label="Quick prompts">
            {[
              'Low-cost counselling',
              'Find a psychologist near me',
              'Crisis help in Australia',
              'LGBTQIA+ friendly services',
            ].map(q => (
              <button
                key={q}
                type="button"
                className="chip"
                aria-label={`Start chat with: ${q}`}
                onClick={() => start(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Updated order to match new section order */}
          <nav className="hero-links reveal delay-5" aria-label="On this page">
            <a href="#how">How it works</a>
            <a href="#help-crisis">Help & Crisis</a>
            <a href="#principles">Our principles</a>
            <a href="#faq">FAQ</a>
          </nav>
        </Container>
      </section>

      {/* HOW IT WORKS — 2-col + decorative brand SVG */}
      <section id="how" className="edge section pattern-a hero-block">
        <Container>
          <div className="how-grid">
            <div className="how-copy">
              <header className="section-head reveal">
                <h2 className="h1">How it works</h2>
                <p className="muted">Simple steps. No matching. No endorsements.</p>
              </header>

              <ol className="steps reveal delay-1">
                <li>
                  <div className="step-num">1</div>
                  <div>
                    <h3>Search your area</h3>
                    <p>Enter a suburb or postcode to explore services, including telehealth options.</p>
                  </div>
                </li>
                <li>
                  <div className="step-num">2</div>
                  <div>
                    <h3>Review information</h3>
                    <p>See specialties, fees, hours, languages and access options at a glance.</p>
                  </div>
                </li>
                <li>
                  <div className="step-num">3</div>
                  <div>
                    <h3>Contact directly</h3>
                    <p>Reach providers via their website, phone or email. Always verify details.</p>
                  </div>
                </li>
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
            <h2 id="help-title" className="h1">Help & Crisis</h2>
          </header>

          <aside className="crisis-banner reveal delay-1" role="note" aria-live="polite">
            <strong>If you’re in immediate danger, call 000.</strong>
          </aside>

          <div className="hotlines reveal delay-2" role="group" aria-label="24/7 support numbers">
            <a className="hotline" href="tel:131114" aria-label="Call Lifeline on 13 11 14">
              <h3>Lifeline</h3>
              <p className="phone">13 11 14</p>
              <span className="tag">24/7</span>
            </a>
            <a className="hotline" href="tel:1800551800" aria-label="Call Kids Helpline on 1800 55 1800">
              <h3>Kids Helpline</h3>
              <p className="phone">1800 55 1800</p>
              <span className="tag">24/7</span>
            </a>
            <a className="hotline" href="tel:1300224636" aria-label="Call Beyond Blue on 1300 22 4636">
              <h3>Beyond Blue</h3>
              <p className="phone">1300 22 4636</p>
              <span className="tag">24/7</span>
            </a>
          </div>

          <div className="grid grid-3 reveal delay-3">
            <div className="card">
              <h3>What is Support Atlas?</h3>
              <p>We’re an information directory. We don’t diagnose, refer, or endorse providers.</p>
            </div>
            <div className="card">
              <h3>Anonymous chat</h3>
              <p>Use chat without an account. Messages aren’t stored. Sign in to save history.</p>
            </div>
            <div className="card">
              <h3>List a service</h3>
              <p>Suggest a new service or update an existing one. Anonymous suggestions are moderated.</p>
            </div>
          </div>

          <div className="cta-row reveal delay-4">
            <button className="btn btn-primary" onClick={() => start()}>Ask in chat</button>
          </div>
        </Container>
      </section>

      {/* OUR PRINCIPLES — static large cards */}
      <section id="principles" className="edge section hero-block" aria-labelledby="principles-title">
        <Container>
          <header className="section-head reveal">
            <h2 id="principles-title" className="h1">Our principles</h2>
          </header>

          <div className="p-grid reveal delay-1" role="group" aria-label="Principles">
            <article className="p-card">
              <header><span className="p-dot" aria-hidden="true" />Calm</header>
              <p>Gentle colour, clear hierarchy and generous spacing lower anxiety.</p>
            </article>
            <article className="p-card">
              <header><span className="p-dot" aria-hidden="true" />Trust</header>
              <p>Consistent design, plain language and privacy by default build confidence.</p>
            </article>
            <article className="p-card">
              <header><span className="p-dot" aria-hidden="true" />Support</header>
              <p>Meet people where they are. Offer kind, actionable next steps.</p>
            </article>
            <article className="p-card">
              <header><span className="p-dot" aria-hidden="true" />Inclusive</header>
              <p>Keyboard-friendly, screen-reader-ready, and reduced-motion aware.</p>
            </article>
          </div>
        </Container>
      </section>

      {/* FAQ — minimal accordion */}
      <section id="faq" className="edge section pattern-faq hero-block" aria-labelledby="faq-title">
        <Container>
          <header className="section-head reveal">
            <h2 id="faq-title" className="h1">Frequently asked questions</h2>
            <p className="muted">Tap a question to reveal the answer.</p>
          </header>

          <div className="faq-list">
            <details className="faq-min reveal">
              <summary>Is this medical advice or a referral service?</summary>
              <div>No — we provide information only. Contact providers directly for care.</div>
            </details>
            <details className="faq-min reveal delay-1">
              <summary>Can I use chat without an account?</summary>
              <div>Yes. Anonymous chat is available; messages aren’t stored. Sign in to save history.</div>
            </details>
            <details className="faq-min reveal delay-2">
              <summary>How do I find services near me?</summary>
              <div>Start a chat or search by suburb/postcode to browse nearby and telehealth options.</div>
            </details>
            <details className="faq-min reveal delay-3">
              <summary>What about privacy?</summary>
              <div>We minimise data collection and don’t share without consent.</div>
            </details>
            <details className="faq-min reveal delay-4">
              <summary>Do you endorse or rate providers?</summary>
              <div>No. We list information only, so you can reach out and decide what’s right for you.</div>
            </details>
            <details className="faq-min reveal delay-5">
              <summary>What should I do in an emergency?</summary>
              <div>Call <strong>000</strong>. You can also use the crisis numbers above for 24/7 support.</div>
            </details>
          </div>
        </Container>
      </section>
    </div>
  );
}