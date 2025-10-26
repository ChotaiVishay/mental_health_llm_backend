import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type EasyModeContextValue = {
  easyMode: boolean;
  enableEasyMode: () => void;
  disableEasyMode: () => void;
  toggleEasyMode: () => void;
  setEasyMode: (value: boolean) => void;
};

const STORAGE_KEY = 'support-atlas:preferences:easy-mode';

const noop = () => {};

const EasyModeContext = createContext<EasyModeContextValue>({
  easyMode: false,
  enableEasyMode: noop,
  disableEasyMode: noop,
  toggleEasyMode: noop,
  setEasyMode: noop,
});

type EasyModeProviderProps = {
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
    // Swallow storage errors to keep the session interactive even in private mode.
  }
}

export function EasyModeProvider({ children }: EasyModeProviderProps) {
  const [easyMode, setEasyModeState] = useState<boolean>(readInitialState);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('easy-mode', easyMode);
    root.setAttribute('data-easy-mode', easyMode ? 'on' : 'off');

    persistState(easyMode);

    return () => {
      root.classList.remove('easy-mode');
      root.removeAttribute('data-easy-mode');
    };
  }, [easyMode]);

  const enableEasyMode = useCallback(() => {
    setEasyModeState(true);
  }, []);

  const disableEasyMode = useCallback(() => {
    setEasyModeState(false);
  }, []);

  const toggleEasyMode = useCallback(() => {
    setEasyModeState((prev) => !prev);
  }, []);

  const setEasyMode = useCallback((value: boolean) => {
    setEasyModeState(Boolean(value));
  }, []);

  const value = useMemo<EasyModeContextValue>(
    () => ({
      easyMode,
      enableEasyMode,
      disableEasyMode,
      toggleEasyMode,
      setEasyMode,
    }),
    [easyMode, enableEasyMode, disableEasyMode, toggleEasyMode, setEasyMode],
  );

  return <EasyModeContext.Provider value={value}>{children}</EasyModeContext.Provider>;
}

export function useEasyMode() {
  return useContext(EasyModeContext);
}
