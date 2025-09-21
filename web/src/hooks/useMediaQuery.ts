import { useEffect, useState } from 'react';

export default function useMediaQuery(query: string) {
  const get = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };

  const [matches, setMatches] = useState<boolean>(get);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setMatches(false);
      return;
    }

    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern browsers
    m.addEventListener?.('change', handler);

    // Fallback for older browsers (e.g. older Safari)
    const prevOnChange = m.onchange;
    m.onchange = handler;

    // Sync initial state
    setMatches(m.matches);

    return () => {
      m.removeEventListener?.('change', handler);
      m.onchange = prevOnChange ?? null;
    };
  }, [query]);

  return matches;
}