import { useCallback, useEffect, useRef } from 'react';

const SAFE_URLS = [
  'https://www.abc.net.au/news',
  'https://www.bom.gov.au/',
  'https://en.wikipedia.org/wiki/Main_Page',
  'https://www.youtube.com/',
  'https://www.nationalgeographic.com/',
];

function openSafeDestination(target: string) {
  const opened = window.open(target, '_blank', 'noopener,noreferrer');
  if (opened) {
    opened.focus();
  }

  try {
    window.location.replace(target);
  } catch {
    window.location.href = target;
  }

  try {
    window.open('', '_self');
    window.close();
  } catch {
    // Browsers may block closing the current tab; ignore.
  }
}

export default function QuickExitBar() {
  const lastEscapeRef = useRef<number | null>(null);

  const handleExit = useCallback(() => {
    const target = SAFE_URLS[Math.floor(Math.random() * SAFE_URLS.length)];
    openSafeDestination(target);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const now = Date.now();
      if (lastEscapeRef.current && now - lastEscapeRef.current < 1200) {
        handleExit();
        lastEscapeRef.current = null;
        return;
      }
      lastEscapeRef.current = now;
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExit]);

  return (
    <div className="quick-exit-bar" role="complementary" aria-label="Quick exit banner">
      <div className="quick-exit-inner">
        <span className="quick-exit-copy">
          Need to leave quickly? This button opens a neutral site and replaces Support Atlas. Press Escape twice for the same action.
        </span>
        <button
          type="button"
          className="quick-exit-button"
          onClick={handleExit}
        >
          Leave this site
        </button>
      </div>
    </div>
  );
}
