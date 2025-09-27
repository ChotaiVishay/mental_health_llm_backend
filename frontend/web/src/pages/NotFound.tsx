import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Title from '@/components/misc/Title';
import '@/styles/pages/not-found.css';

export default function NotFound() {
  const loc = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the error heading on mount (a11y-friendly; avoids autoFocus prop)
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="nf-page" aria-labelledby="nf-title">
      <Title value="404 — Page not found" />
      <div className="nf-card" role="region" aria-labelledby="nf-title">
        <div className="nf-code">404</div>
        <h1
          id="nf-title"
          className="nf-title"
          tabIndex={-1}
          ref={headingRef}
        >
          Page not found
        </h1>

        <p className="nf-sub">
          We couldn’t find <code className="nf-path">{loc.pathname}</code>.
        </p>

        <div className="nf-actions" role="group" aria-label="Navigation actions">
          <Link to="/" className="btn primary">
            ← Back to Home
          </Link>
          <Link to="/chat" className="btn">
            Go to Chat
          </Link>
        </div>

        <p className="nf-foot muted">
          If you typed the address, double-check the spelling.
        </p>
      </div>
    </section>
  );
}