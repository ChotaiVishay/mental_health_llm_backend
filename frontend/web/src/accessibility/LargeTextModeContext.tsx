import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type LargeTextModeContextValue = {
  largeText: boolean;
  enableLargeText: () => void;
  disableLargeText: () => void;
  toggleLargeText: () => void;
  setLargeText: (value: boolean) => void;
};

const STORAGE_KEY = 'support-atlas:preferences:large-text-mode';

const noop = () => {};

const LargeTextModeContext = createContext<LargeTextModeContextValue>({
  largeText: false,
  enableLargeText: noop,
  disableLargeText: noop,
  toggleLargeText: noop,
  setLargeText: noop,
});

type LargeTextModeProviderProps = {
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
    // Swallow storage errors so the UI stays responsive.
  }
}

export function LargeTextModeProvider({ children }: LargeTextModeProviderProps) {
  const [largeText, setLargeTextState] = useState<boolean>(readInitialState);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('large-text-mode', largeText);
    root.setAttribute('data-large-text', largeText ? 'on' : 'off');

    persistState(largeText);

    return () => {
      root.classList.remove('large-text-mode');
      root.removeAttribute('data-large-text');
    };
  }, [largeText]);

  const enableLargeText = useCallback(() => {
    setLargeTextState(true);
  }, []);

  const disableLargeText = useCallback(() => {
    setLargeTextState(false);
  }, []);

  const toggleLargeText = useCallback(() => {
    setLargeTextState((prev) => !prev);
  }, []);

  const setLargeText = useCallback((value: boolean) => {
    setLargeTextState(Boolean(value));
  }, []);

  const value = useMemo<LargeTextModeContextValue>(
    () => ({
      largeText,
      enableLargeText,
      disableLargeText,
      toggleLargeText,
      setLargeText,
    }),
    [largeText, enableLargeText, disableLargeText, toggleLargeText, setLargeText],
  );

  return <LargeTextModeContext.Provider value={value}>{children}</LargeTextModeContext.Provider>;
}

export function useLargeTextMode() {
  return useContext(LargeTextModeContext);
}
