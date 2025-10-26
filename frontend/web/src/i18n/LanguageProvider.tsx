import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_LANGUAGE_CODE,
  LANGUAGE_PACKS,
  type LanguagePack,
  type SupportedLanguageCode,
  isSupportedLanguage,
} from './translations';

type LanguageOption = {
  code: SupportedLanguageCode;
  label: string;
  nativeLabel: string;
};

type LanguageContextValue = {
  language: SupportedLanguageCode;
  setLanguage: (code: SupportedLanguageCode) => void;
  t: (key: string) => string;
  list: (key: string) => string[];
  options: LanguageOption[];
  locale: string;
  keyboard: string[];
  currentPack: LanguagePack;
};

const STORAGE_KEY = 'support-atlas.language';

const LANGUAGE_OPTIONS: LanguageOption[] = Object.values(LANGUAGE_PACKS).map((pack) => ({
  code: pack.code,
  label: pack.label,
  nativeLabel: pack.nativeLabel,
}));

const FALLBACK_PACK = LANGUAGE_PACKS[DEFAULT_LANGUAGE_CODE];

const DEFAULT_VALUE: LanguageContextValue = {
  language: FALLBACK_PACK.code,
  setLanguage: () => {},
  t: (key: string) => FALLBACK_PACK.strings[key] ?? key,
  list: (key: string) => FALLBACK_PACK.lists[key] ?? [],
  options: LANGUAGE_OPTIONS,
  locale: FALLBACK_PACK.locale,
  keyboard: FALLBACK_PACK.keyboard,
  currentPack: FALLBACK_PACK,
};

const LanguageContext = createContext<LanguageContextValue>(DEFAULT_VALUE);

function getInitialLanguage(): SupportedLanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE_CODE;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isSupportedLanguage(stored)) return stored;

  const candidates = window.navigator.languages ?? [window.navigator.language];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const code = candidate.toLowerCase().split('-')[0];
    if (isSupportedLanguage(code)) return code;
  }

  return DEFAULT_LANGUAGE_CODE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguageCode>(getInitialLanguage);

  const fallbackPack = FALLBACK_PACK;
  const pack = LANGUAGE_PACKS[language] ?? fallbackPack;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = pack.locale;
  }, [pack.locale]);

  const setLanguageSafe = useCallback(
    (code: SupportedLanguageCode) => {
      setLanguage(isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE_CODE);
    },
    [],
  );

  const value = useMemo<LanguageContextValue>(() => {
    const translate = (key: string) => pack.strings[key] ?? fallbackPack.strings[key] ?? key;
    const translateList = (key: string) => pack.lists[key] ?? fallbackPack.lists[key] ?? [];

    return {
      language: pack.code,
      setLanguage: setLanguageSafe,
      t: translate,
      list: translateList,
      options: LANGUAGE_OPTIONS,
      locale: pack.locale,
      keyboard: pack.keyboard,
      currentPack: pack,
    };
  }, [fallbackPack, pack, setLanguageSafe]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx;
}

export function useTranslation() {
  const { t } = useLanguage();
  return t;
}
