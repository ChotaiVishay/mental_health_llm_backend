import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type DyslexicModeContextValue = {
  dyslexicMode: boolean;
  enableDyslexicMode: () => void;
  disableDyslexicMode: () => void;
  toggleDyslexicMode: () => void;
  setDyslexicMode: (value: boolean) => void;
};

const STORAGE_KEY = 'support-atlas:preferences:dyslexic-mode';

const noop = () => {};

const DyslexicModeContext = createContext<DyslexicModeContextValue>({
  dyslexicMode: false,
  enableDyslexicMode: noop,
  disableDyslexicMode: noop,
  toggleDyslexicMode: noop,
  setDyslexicMode: noop,
});

type DyslexicModeProviderProps = {
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
    // Ignore storage failures so the experience still works for the session.
  }
}

export function DyslexicModeProvider({ children }: DyslexicModeProviderProps) {
  const [dyslexicMode, setDyslexicModeState] = useState<boolean>(readInitialState);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('dyslexic-mode', dyslexicMode);
    root.setAttribute('data-dyslexic-mode', dyslexicMode ? 'on' : 'off');

    persistState(dyslexicMode);

    return () => {
      root.classList.remove('dyslexic-mode');
      root.removeAttribute('data-dyslexic-mode');
    };
  }, [dyslexicMode]);

  const enableDyslexicMode = useCallback(() => {
    setDyslexicModeState(true);
  }, []);

  const disableDyslexicMode = useCallback(() => {
    setDyslexicModeState(false);
  }, []);

  const toggleDyslexicMode = useCallback(() => {
    setDyslexicModeState((prev) => !prev);
  }, []);

  const setDyslexicMode = useCallback((value: boolean) => {
    setDyslexicModeState(Boolean(value));
  }, []);

  const value = useMemo<DyslexicModeContextValue>(() => ({
    dyslexicMode,
    enableDyslexicMode,
    disableDyslexicMode,
    toggleDyslexicMode,
    setDyslexicMode,
  }), [dyslexicMode, enableDyslexicMode, disableDyslexicMode, toggleDyslexicMode, setDyslexicMode]);

  return (
    <DyslexicModeContext.Provider value={value}>
      {children}
    </DyslexicModeContext.Provider>
  );
}

export function useDyslexicMode() {
  return useContext(DyslexicModeContext);
}
