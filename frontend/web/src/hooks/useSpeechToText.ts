// Web Speech API wrapper with robust language fallback (sync + async) and friendly errors.
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: unknown) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  onstart: () => void;
}
type SRClass = new () => SpeechRecognition;

type ErrCode =
  | 'unsupported'
  | 'insecure'
  | 'blocked'
  | 'no-mic'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'busy'
  | 'lang-unsupported'
  | 'other';

function friendly(code: ErrCode, raw?: string) {
  switch (code) {
    case 'unsupported':      return 'Voice input is not supported in this browser.';
    case 'insecure':         return 'Voice input needs HTTPS (or localhost).';
    case 'blocked':          return 'Microphone is blocked. Click the site info icon and allow mic.';
    case 'no-mic':           return 'No microphone detected.';
    case 'no-speech':        return 'I didn’t catch that — try speaking again.';
    case 'network':          return 'Speech service network error.';
    case 'aborted':          return 'Listening stopped.';
    case 'busy':             return 'Speech service is busy. Try again in a moment.';
    case 'lang-unsupported': return 'This language isn’t supported for voice input on this device.';
    default:                 return raw || 'Microphone error.';
  }
}

function buildLangCandidates(requested?: string): string[] {
  const out: string[] = [];
  const tag = (requested || '').trim();
  if (tag) out.push(tag);

  const EN_PREFS = ['en-AU', 'en-GB', 'en-US', 'en-CA', 'en-IN'];
  for (const t of EN_PREFS) if (!out.includes(t)) out.push(t);

  if (!out.includes('en-US')) out.push('en-US');
  return out;
}

export function useSpeechToText(opts?: { lang?: string; interim?: boolean }) {
  const isSecure =
    typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.hostname === 'localhost');

  // Typed globals lookup (no `any` casts)
  type SRGlobals = typeof globalThis & {
    SpeechRecognition?: SRClass;
    webkitSpeechRecognition?: SRClass;
  };

  const SR: SRClass | undefined = (() => {
    if (typeof globalThis === 'undefined') return undefined;
    const g = globalThis as SRGlobals;
    return g.SpeechRecognition ?? g.webkitSpeechRecognition ?? undefined;
  })();

  const recRef       = useRef<SpeechRecognition | null>(null);
  const candsRef     = useRef<string[]>([]);
  const candIdxRef   = useRef(0);

  const [isSupported]  = useState<boolean>(!!SR);
  const [isListening, setListening] = useState(false);
  const [interim,     setInterim]   = useState('');
  const [finalText,   setFinal]     = useState<string | null>(null);
  const [errorText,   setErrorText] = useState<string | null>(null);
  const [errorCode,   setErrorCode] = useState<ErrCode | null>(null);
  const startPromiseRef = useRef<((value: boolean) => void) | null>(null);

  const setError = useCallback((code: ErrCode, raw?: string) => {
    setErrorCode(code);
    setErrorText(friendly(code, raw));
  }, []);

  const clearError = useCallback(() => {
    setErrorCode(null);
    setErrorText(null);
  }, []);

  const preflight = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      return true;
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') setError('blocked');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setError('no-mic');
      else setError('other', (e as Error)?.message);
      return false;
    }
  }, [setError]);

  type SRLikeEvent = {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
  };

  const newRecognizer = useCallback(
    (onLangUnsupported: () => boolean): SpeechRecognition => {
      const rec = new (SR as SRClass)();
      rec.interimResults = opts?.interim ?? true;
      rec.continuous = false;

      rec.onstart = () => {
        setListening(true);
        clearError();
        setInterim('');
        startPromiseRef.current?.(true);
        startPromiseRef.current = null;
      };
      rec.onresult = (e: unknown) => {
        const ev = e as SRLikeEvent;
        let interimChunk = '';
        let finalChunk = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) finalChunk += res[0].transcript;
          else interimChunk += res[0].transcript;
        }
        if (interimChunk) setInterim(interimChunk);
        if (finalChunk) setFinal((prev) => (prev ? prev + finalChunk : finalChunk));
      };
      rec.onerror = (e: unknown) => {
        const err = String((e as { error?: string })?.error || '');
        if (err === 'language-not-supported') {
          const handled = onLangUnsupported();
          if (!handled) setError('lang-unsupported');
          if (startPromiseRef.current) {
            startPromiseRef.current(handled);
            startPromiseRef.current = null;
          }
          return;
        }
        if (err === 'not-allowed' || err === 'service-not-allowed') setError('blocked');
        else if (err === 'audio-capture') setError('no-mic');
        else if (err === 'no-speech') setError('no-speech');
        else if (err === 'network') setError('network');
        else if (err === 'aborted') setError('aborted');
        else if (err === 'busy') setError('busy');
        else setError('other', err);
        if (startPromiseRef.current) {
          startPromiseRef.current(false);
          startPromiseRef.current = null;
        }
      };
      rec.onend = () => {
        setListening(false);
      };
      return rec;
    },
    [SR, clearError, opts?.interim, setError]
  );

  const tryStartChain = useCallback((rec: SpeechRecognition) => {
    const cands = candsRef.current;
    while (candIdxRef.current < cands.length) {
      const lang = cands[candIdxRef.current];
      try {
        rec.lang = lang;
        rec.start();
        return true;
      } catch (e: unknown) {
        const msg = String((e as { message?: string; name?: string })?.message || (e as { name?: string })?.name || '');
        if (/not-allowed|service-not-allowed/i.test(msg)) { setError('blocked'); return false; }
        if (/audio-capture/i.test(msg))                 { setError('no-mic');   return false; }
        if (/network/i.test(msg))                       { setError('network');  return false; }
        if (/already started|busy/i.test(msg))          { setError('busy');     return false; }
        candIdxRef.current += 1; // language issue → next candidate
        continue;
      }
    }
    setError('lang-unsupported');
    return false;
  }, [setError]);

  const tryNextCandidate = useCallback(() => {
    candIdxRef.current += 1;
    if (candIdxRef.current >= candsRef.current.length) {
      setError('lang-unsupported');
      return false;
    }
    try {
      recRef.current?.abort();
    } catch (err) {
      void err; // ignore abort race
    }
    const rec = newRecognizer(tryNextCandidate);
    recRef.current = rec;
    return tryStartChain(rec);
  }, [newRecognizer, tryStartChain, setError]);

  const start = useCallback(async (lang?: string) => {
    if (!isSupported) { setError('unsupported'); return false; }
    if (!isSecure)     { setError('insecure');   return false; }
    if (isListening || startPromiseRef.current) return false;

    setFinal(null);
    setInterim('');
    clearError();

    const requested = lang || opts?.lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-AU');
    candsRef.current = buildLangCandidates(requested);
    candIdxRef.current = 0;

    return new Promise<boolean>(async (resolve) => {
      startPromiseRef.current = resolve;

      const rec1 = newRecognizer(() => tryNextCandidate());
      recRef.current = rec1;
      if (tryStartChain(rec1)) return;

      const ok = await preflight();
      if (!ok) {
        startPromiseRef.current?.(false);
        startPromiseRef.current = null;
        return;
      }

      const rec2 = newRecognizer(() => tryNextCandidate());
      recRef.current = rec2;
      if (tryStartChain(rec2)) return;

      startPromiseRef.current?.(false);
      startPromiseRef.current = null;
    });
  }, [
    clearError,
    isListening,
    isSecure,
    isSupported,
    newRecognizer,
    opts?.lang,
    preflight,
    tryNextCandidate,
    tryStartChain,
    setError,
  ]);

  const stop = useCallback(() => {
    const r = recRef.current;
    if (r) {
      try { r.stop(); } catch (err) { void err; }
      try { r.abort(); } catch (err) { void err; }
      recRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    isSupported,
    isListening,
    interim,
    finalText,
    error: errorText,
    errorCode,
    start,
    stop,
  };
}
