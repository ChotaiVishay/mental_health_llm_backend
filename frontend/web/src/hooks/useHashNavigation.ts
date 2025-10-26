import { useCallback, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrollToHash } from '@/utils/scroll';

export function useHashNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback((event: MouseEvent<HTMLElement>, hash: string) => {
    if (!hash) return;
    const normalized = hash.startsWith('#') ? hash : `#${hash}`;

    if (location.pathname === '/') {
      event.preventDefault();
      navigate({ pathname: '/', hash: normalized }, { replace: location.hash === normalized });
      scrollToHash(normalized);
    }
  }, [location.hash, location.pathname, navigate]);
}
