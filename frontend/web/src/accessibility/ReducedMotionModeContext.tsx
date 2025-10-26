import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ReducedMotionModeContextValue = {
  reducedMotion: boolean;
  enableReducedMotion: () => void;
  disableReducedMotion: () => void;
  toggleReducedMotion: () => void;
  setReducedMotion: (value: boolean) => void;
};

const STORAGE_KEY = 'support-atlas:preferences:reduced-motion-mode';

const noop = () => {};

const ReducedMotionModeContext = createContext<ReducedMotionModeContextValue>({
  reducedMotion: false,
  enableReducedMotion: noop,
  disableReducedMotion: noop,
  toggleReducedMotion: noop,
  setReducedMotion: noop,
});

type ReducedMotionModeProviderProps = {
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
    // Ignore storage errors to prioritise session continuity.
  }
}

export function ReducedMotionModeProvider({ children }: ReducedMotionModeProviderProps) {
  const [reducedMotion, setReducedMotionState] = useState<boolean>(readInitialState);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('reduced-motion-mode', reducedMotion);
    root.setAttribute('data-reduced-motion', reducedMotion ? 'on' : 'off');

    persistState(reducedMotion);

    return () => {
      root.classList.remove('reduced-motion-mode');
      root.removeAttribute('data-reduced-motion');
    };
  }, [reducedMotion]);

  const enableReducedMotion = useCallback(() => {
    setReducedMotionState(true);
  }, []);

  const disableReducedMotion = useCallback(() => {
    setReducedMotionState(false);
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotionState((prev) => !prev);
  }, []);

  const setReducedMotion = useCallback((value: boolean) => {
    setReducedMotionState(Boolean(value));
  }, []);

  const value = useMemo<ReducedMotionModeContextValue>(
    () => ({
      reducedMotion,
      enableReducedMotion,
      disableReducedMotion,
      toggleReducedMotion,
      setReducedMotion,
    }),
    [reducedMotion, enableReducedMotion, disableReducedMotion, toggleReducedMotion, setReducedMotion],
  );

  return <ReducedMotionModeContext.Provider value={value}>{children}</ReducedMotionModeContext.Provider>;
}

export function useReducedMotionMode() {
  return useContext(ReducedMotionModeContext);
}
