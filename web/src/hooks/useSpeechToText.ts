// Web Speech API wrapper with robust language fallback (sync + async) and friendly errors.
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
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

  // If a specific tag was requested (e.g. en-AU), try it first.
  if (tag) out.push(tag);

  // Prefer concrete English locales (Chrome often rejects bare "en").
  const EN_PREFS = ['en-AU', 'en-GB', 'en-US', 'en-CA', 'en-IN'];
  for (const t of EN_PREFS) if (!out.includes(t)) out.push(t);

  // Always include a final US fallback.
  if (!out.includes('en-US')) out.push('en-US');

  return out;
}

export function useSpeechToText(opts?: { lang?: string; interim?: boolean }) {
  const isSecure =
    typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.hostname === 'localhost');

  const SR: SRClass | undefined =
    (typeof window !== 'undefined' &&
      (((window as any).SpeechRecognition as SRClass) ||
       ((window as any).webkitSpeechRecognition as SRClass))) ||
    undefined;

  const recRef       = useRef<SpeechRecognition | null>(null);
  const startedRef   = useRef(false);
  const candsRef     = useRef<string[]>([]);
  const candIdxRef   = useRef(0);

  const [isSupported]  = useState<boolean>(!!SR);
  const [isListening, setListening] = useState(false);
  const [interim,     setInterim]   = useState('');
  const [finalText,   setFinal]     = useState<string | null>(null);
  const [errorText,   setErrorText] = useState<string | null>(null);

  const preflight = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach(t => t.stop());
      return true;
    } catch (e: any) {
      const name = e?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') setErrorText(friendly('blocked'));
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setErrorText(friendly('no-mic'));
      else setErrorText(friendly('other', e?.message));
      return false;
    }
  }, []);

  const newRecognizer = useCallback((): SpeechRecognition => {
    const rec = new (SR as SRClass)();
    rec.interimResults = opts?.interim ?? true;
    rec.continuous = false;

    rec.onstart = () => { setListening(true); setErrorText(null); setInterim(''); };
    rec.onresult = (e: any) => {
      let interimChunk = '';
      let finalChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalChunk += res[0].transcript;
        else interimChunk += res[0].transcript;
      }
      if (interimChunk) setInterim(interimChunk);
      if (finalChunk) setFinal(prev => (prev ? prev + finalChunk : finalChunk));
    };
    rec.onerror = (e: any) => {
      const err = String(e?.error || '');
      if (err === 'language-not-supported') { tryNextCandidate(); return; }
      if (err === 'not-allowed' || err === 'service-not-allowed') setErrorText(friendly('blocked'));
      else if (err === 'audio-capture') setErrorText(friendly('no-mic'));
      else if (err === 'no-speech') setErrorText(friendly('no-speech'));
      else if (err === 'network') setErrorText(friendly('network'));
      else if (err === 'aborted') setErrorText(friendly('aborted'));
      else if (err === 'busy') setErrorText(friendly('busy'));
      else setErrorText(friendly('other', err));
    };
    rec.onend = () => { setListening(false); startedRef.current = false; };
    return rec;
  }, [SR, opts?.interim]);

  // Try to start, advancing candidates if the failure looks like a language reject.
  const tryStartChain = useCallback((rec: SpeechRecognition) => {
    const cands = candsRef.current;
    while (candIdxRef.current < cands.length) {
      const lang = cands[candIdxRef.current];
      try {
        rec.lang = lang;
        rec.start();
        startedRef.current = true;
        return true;
      } catch (e: any) {
        const msg = (e?.message || e?.name || '').toString();

        // Hard failures that shouldn't rotate languages:
        if (/not-allowed|service-not-allowed/i.test(msg)) { setErrorText(friendly('blocked')); return false; }
        if (/audio-capture/i.test(msg))                 { setErrorText(friendly('no-mic'));   return false; }
        if (/network/i.test(msg))                       { setErrorText(friendly('network'));  return false; }
        if (/already started|busy/i.test(msg))          { setErrorText(friendly('busy'));     return false; }

        // Anything else (incl. language issues) → try the next candidate.
        candIdxRef.current += 1;
        continue;
      }
    }
    setErrorText(friendly('lang-unsupported'));
    return false;
  }, []);

  // Called when onerror('language-not-supported') fires.
  const tryNextCandidate = useCallback(() => {
    candIdxRef.current += 1;
    if (candIdxRef.current >= candsRef.current.length) {
      setErrorText(friendly('lang-unsupported'));
      return;
    }
    try { recRef.current?.abort(); } catch {}
    const rec = newRecognizer();
    recRef.current = rec;
    tryStartChain(rec);
  }, [newRecognizer, tryStartChain]);

  const start = useCallback(async (lang?: string) => {
    if (!isSupported) { setErrorText(friendly('unsupported')); return; }
    if (!isSecure)     { setErrorText(friendly('insecure'));   return; }
    if (isListening || startedRef.current) return;

    setFinal(null);
    setInterim('');
    setErrorText(null);

    const requested = lang || opts?.lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-AU');
    candsRef.current = buildLangCandidates(requested);
    candIdxRef.current = 0;

    // Immediate attempt to preserve the user gesture.
    let rec = newRecognizer();
    recRef.current = rec;
    if (tryStartChain(rec)) return;

    // If we got a synchronous failure, do a permission preflight then retry the chain.
    const ok = await preflight();
    if (!ok) return;

    rec = newRecognizer();
    recRef.current = rec;
    tryStartChain(rec);
  }, [isSupported, isSecure, isListening, opts?.lang, preflight, newRecognizer, tryStartChain]);

  const stop = useCallback(() => {
    const r = recRef.current;
    if (r) { try { r.stop(); } catch {} try { r.abort(); } catch {} recRef.current = null; }
    startedRef.current = false;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    isSupported,
    isListening,
    interim,
    finalText,
    error: errorText,
    start,
    stop,
  };
}