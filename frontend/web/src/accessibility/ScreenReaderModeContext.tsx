import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ScreenReaderModeContextValue = {
  screenReaderAssist: boolean;
  enableScreenReaderAssist: () => void;
  disableScreenReaderAssist: () => void;
  toggleScreenReaderAssist: () => void;
  setScreenReaderAssist: (value: boolean) => void;
};

const STORAGE_KEY = 'support-atlas:preferences:screen-reader-mode';

const noop = () => {};

const ScreenReaderModeContext = createContext<ScreenReaderModeContextValue>({
  screenReaderAssist: false,
  enableScreenReaderAssist: noop,
  disableScreenReaderAssist: noop,
  toggleScreenReaderAssist: noop,
  setScreenReaderAssist: noop,
});

type ScreenReaderModeProviderProps = {
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
    // Continue even if storage fails (e.g. Safari private mode).
  }
}

export function ScreenReaderModeProvider({ children }: ScreenReaderModeProviderProps) {
  const [screenReaderAssist, setScreenReaderAssistState] = useState<boolean>(readInitialState);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('screen-reader-mode', screenReaderAssist);
    root.setAttribute('data-screen-reader-assist', screenReaderAssist ? 'on' : 'off');

    persistState(screenReaderAssist);

    return () => {
      root.classList.remove('screen-reader-mode');
      root.removeAttribute('data-screen-reader-assist');
    };
  }, [screenReaderAssist]);

  const enableScreenReaderAssist = useCallback(() => {
    setScreenReaderAssistState(true);
  }, []);

  const disableScreenReaderAssist = useCallback(() => {
    setScreenReaderAssistState(false);
  }, []);

  const toggleScreenReaderAssist = useCallback(() => {
    setScreenReaderAssistState((prev) => !prev);
  }, []);

  const setScreenReaderAssist = useCallback((value: boolean) => {
    setScreenReaderAssistState(Boolean(value));
  }, []);

  const value = useMemo<ScreenReaderModeContextValue>(
    () => ({
      screenReaderAssist,
      enableScreenReaderAssist,
      disableScreenReaderAssist,
      toggleScreenReaderAssist,
      setScreenReaderAssist,
    }),
    [
      screenReaderAssist,
      enableScreenReaderAssist,
      disableScreenReaderAssist,
      toggleScreenReaderAssist,
      setScreenReaderAssist,
    ],
  );

  return <ScreenReaderModeContext.Provider value={value}>{children}</ScreenReaderModeContext.Provider>;
}

export function useScreenReaderMode() {
  return useContext(ScreenReaderModeContext);
}
