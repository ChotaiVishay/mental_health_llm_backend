import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type HighContrastModeContextValue = {
  highContrast: boolean;
  enableHighContrast: () => void;
  disableHighContrast: () => void;
  toggleHighContrast: () => void;
  setHighContrast: (value: boolean) => void;
};

const STORAGE_KEY = 'support-atlas:preferences:high-contrast-mode';

const noop = () => {};

const HighContrastModeContext = createContext<HighContrastModeContextValue>({
  highContrast: false,
  enableHighContrast: noop,
  disableHighContrast: noop,
  toggleHighContrast: noop,
  setHighContrast: noop,
});

type HighContrastModeProviderProps = {
  children: ReactNode;
};

function readInitialState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'on';
  } catch {
    return false;
  }
}

function persistState(nextState: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, nextState ? 'on' : 'off');
  } catch {
    // Ignore storage errors to keep runtime resilient in private browsing.
  }
}

export function HighContrastModeProvider({ children }: HighContrastModeProviderProps) {
  const [highContrast, setHighContrastState] = useState<boolean>(readInitialState);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('high-contrast-mode', highContrast);
    root.setAttribute('data-high-contrast', highContrast ? 'on' : 'off');

    persistState(highContrast);

    return () => {
      root.classList.remove('high-contrast-mode');
      root.removeAttribute('data-high-contrast');
    };
  }, [highContrast]);

  const enableHighContrast = useCallback(() => {
    setHighContrastState(true);
  }, []);

  const disableHighContrast = useCallback(() => {
    setHighContrastState(false);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => !prev);
  }, []);

  const setHighContrast = useCallback((value: boolean) => {
    setHighContrastState(Boolean(value));
  }, []);

  const value = useMemo<HighContrastModeContextValue>(
    () => ({
      highContrast,
      enableHighContrast,
      disableHighContrast,
      toggleHighContrast,
      setHighContrast,
    }),
    [highContrast, enableHighContrast, disableHighContrast, toggleHighContrast, setHighContrast],
  );

  return <HighContrastModeContext.Provider value={value}>{children}</HighContrastModeContext.Provider>;
}

export function useHighContrastMode() {
  return useContext(HighContrastModeContext);
}
