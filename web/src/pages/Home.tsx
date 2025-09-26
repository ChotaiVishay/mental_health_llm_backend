import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePreloginChat } from '@/features/chat/sessionStore';
import Container from '@/components/layout/Container';

type ParallaxEl = HTMLElement & { dataset: { speed?: string } };

export default function Home() {
  const nav = useNavigate();
  const parallaxRoot = useRef<HTMLDivElement>(null);

  const start = (seed?: string) => {
    if (seed) {
      const now = Date.now();
      savePreloginChat({
        messages: [{ id: `u_${now}`, role: 'user', text: seed, at: now }],
      });
    }
    nav('/chat');
  };

  // Reveal + Parallax (respects prefers-reduced-motion)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && (e.target as HTMLElement).classList.add('in')),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );
    document.querySelectorAll<HTMLElement>('.reveal').forEach(el => io.observe(el));

    if (!reduce) {
      const els = parallaxRoot.current?.querySelectorAll<ParallaxEl>('[data-par]') ?? [];
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          els.forEach(el => {
            const speed = parseFloat(el.dataset.speed || '0.2');
            el.style.transform = `translate3d(0, ${y * speed * -0.15}px, 0)`;
          });
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }

    return () => io.disconnect();
  }, []);

  return (
    <div className="home" ref={parallaxRoot}>
      {/* ===== HERO (floating media + calm gradient) ===== */}
      <section id="top" className="home-hero">
        <div className="hero-bg" role="img" aria-label="Calm abstract background" />

        {/* Replace these with real images later */}
        <img data-par data-speed="0.25" className="tile tile-a" src="/assets/placeholder-1.jpg" alt="" loading="lazy" />
        <img data-par data-speed="0.18" className="tile tile-b" src="/assets/placeholder-2.jpg" alt="" loading="lazy" />
        <img data-par data-speed="0.22" className="tile tile-c" src="/assets/placeholder-3.jpg" alt="" loading="lazy" />

        <Container>
          <div className="hero-inner">
            <h1 className="display reveal">Support Atlas Assistant</h1>
            <p className="lead reveal delay-1">
              Find mental-health services and answers fast — chat anonymously, sign in later to save.
            </p>

            <div className="cta-card reveal delay-2" role="group" aria-labelledby="cta-title">
              <button
                id="cta-title"
                type="button"
                className="btn btn-primary big"
                aria-describedby="cta-helptext"
                onClick={() => start()}
              >
                Start Chat
              </button>

              <div id="cta-helptext" className="muted">
                No sign-in required. You can sign in later if you want your conversation history saved.
              </div>

              <div aria-label="Quick prompts" className="chips">
                {[
                  'Find a psychologist near me',
                  'Low-cost counselling options',
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
            </div>

            <nav className="hero-links reveal delay-3" aria-label="Sections">
              <a href="#how">How it works</a>
              <a href="#principles">Our principles</a>
              <a href="#safety">Safety & privacy</a>
              <a href="#providers">For providers</a>
            </nav>
          </div>
        </Container>
      </section>

      {/* ===== NEW: SCROLLY — text sticks, background moves ===== */}
      <section id="story" className="scrolly">
        {/* moving background layers (placeholders) */}
        <div className="scrolly-bg" aria-hidden="true">
          <img data-par data-speed="0.06" className="layer l1" src="/assets/placeholder-4.jpg" alt="" />
          <img data-par data-speed="0.12" className="layer l2" src="/assets/placeholder-5.jpg" alt="" />
          <img data-par data-speed="0.18" className="layer l3" src="/assets/placeholder-6.jpg" alt="" />
        </div>

        <Container>
          <div className="scrolly-grid">
            <div className="stickycopy">
              <h2 className="display-xl">Take the first step.</h2>
              <p className="lead">
                Scroll to explore how Support Atlas works. The message stays with you while the world
                behind it moves.
              </p>
              <p className="muted">
                Tip: try it on desktop and mobile—animations respect reduced-motion settings.
              </p>
              <p className="scrolly-jump">
                <a href="#how">See how it works ↓</a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats reveal">
        <Container>
          <ul className="stat-list" aria-label="Platform stats">
            <li><strong>2,500+</strong><span>Services listed</span></li>
            <li><strong>24/7</strong><span>Crisis numbers</span></li>
            <li><strong>450+</strong><span>Locations</span></li>
            <li><strong>Multi-lang</strong><span>Support</span></li>
          </ul>
        </Container>
      </section>

      {/* ===== NEW: BOLD TYPOGRAPHIC STATEMENT ===== */}
      <section className="display-slab reveal" aria-label="Big statement">
        <Container>
          <h2 className="slab">Get support in minutes.</h2>
          <a className="btn btn-secondary" href="#top">Start now</a>
        </Container>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="section reveal">
        <Container>
          <header className="section-head">
            <h2 className="h1">How it works</h2>
            <p className="muted">Simple, transparent steps — no matching, no endorsements.</p>
          </header>

          <ol className="steps">
            <li>
              <div className="step-num">1</div>
              <h3>Search your area</h3>
              <p>Enter a suburb or postcode to browse nearby services, including telehealth options.</p>
            </li>
            <li>
              <div className="step-num">2</div>
              <h3>Review information</h3>
              <p>See clear details (specialties, fees, hours, languages). We don’t match or recommend.</p>
            </li>
            <li>
              <div className="step-num">3</div>
              <h3>Contact directly</h3>
              <p>Reach providers via their website, phone or email. Verify details with the provider.</p>
            </li>
          </ol>
        </Container>
      </section>

      {/* ===== PRINCIPLES ===== */}
      <section id="principles" className="section alt reveal">
        <Container>
          <header className="section-head">
            <h2 className="h1">Our principles</h2>
          </header>

          <div className="grid-2">
            <div>
              <h3>Calm</h3>
              <p>Lower anxiety with simple choices, gentle colour, and spacious layouts.</p>
            </div>
            <div>
              <h3>Trust</h3>
              <p>Be consistent, cite sources where available, and protect privacy.</p>
            </div>
            <div>
              <h3>Support</h3>
              <p>Meet people where they are. Never diagnose. Offer clear next steps.</p>
            </div>
            <div>
              <h3>Inclusive</h3>
              <p>Accessible by design: keyboard-friendly, screen-reader support, large touch targets.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== SAFETY ===== */}
      <section id="safety" className="section reveal">
        <Container>
          <header className="section-head">
            <h2 className="h1">Safety & privacy</h2>
          </header>

          <div className="grid-3">
            <div>
              <h3>Information-only</h3>
              <p>We do not provide medical advice, diagnosis, referrals, or endorsements.</p>
            </div>
            <div>
              <h3>Privacy protected</h3>
              <p>Anonymous chat is available. Minimise data; don’t share without consent.</p>
            </div>
            <div>
              <h3>Accessible</h3>
              <p>Strong contrast, large targets, semantic HTML, and reduced-motion support.</p>
            </div>
          </div>

          <aside className="callout">
            If you’re in immediate danger, call <strong>000</strong>. For 24/7 support: Lifeline <strong>13 11 14</strong>.
          </aside>
        </Container>
      </section>

      {/* ===== PROVIDERS ===== */}
      <section id="providers" className="section alt reveal">
        <Container>
          <header className="section-head">
            <h2 className="display-sm">For service providers</h2>
            <p className="muted">
              Create or update a listing. Suggestions go to moderation; super-users approve changes.
            </p>
          </header>

          <div className="cta-row">
            <a className="btn btn-primary" href="/admin">List a service</a>
            <a className="btn btn-secondary" href="/contact">Learn more</a>
          </div>
        </Container>
      </section>
    </div>
  );
}