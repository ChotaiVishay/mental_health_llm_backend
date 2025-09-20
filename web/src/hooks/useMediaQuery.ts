import { useEffect, useState } from 'react';

export default function useMediaQuery(query: string) {
  const get = () =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    // support older browsers
    if (m.addEventListener) m.addEventListener('change', handler);
    else m.addListener(handler as any);

    setMatches(m.matches);
    return () => {
      if (m.removeEventListener) m.removeEventListener('change', handler);
      else m.removeListener(handler as any);
    };
  }, [query]);

  return matches;
}