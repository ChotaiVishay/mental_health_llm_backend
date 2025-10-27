type Synth = SpeechSynthesis & {
  addEventListener?: (type: 'voiceschanged', cb: () => void) => void;
  removeEventListener?: (type: 'voiceschanged', cb: () => void) => void;
};

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function normalizeTag(tag: string | undefined | null) {
  return (tag ?? '').trim().toLowerCase();
}

function ensureVoices(synth: Synth): SpeechSynthesisVoice[] {
  if (!cachedVoices || cachedVoices.length === 0) {
    const voices = synth.getVoices ? synth.getVoices() : [];
    cachedVoices = voices;
    if (voices.length === 0 && synth.addEventListener) {
      const handler = () => {
        cachedVoices = synth.getVoices();
        synth.removeEventListener?.('voiceschanged', handler);
      };
      synth.addEventListener('voiceschanged', handler);
    }
  }
  return cachedVoices ?? [];
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  if (!voices.length) return undefined;
  const wanted = normalizeTag(lang);
  if (!wanted) return voices[0];
  const exact = voices.find((voice) => normalizeTag(voice.lang) === wanted);
  if (exact) return exact;
  const base = wanted.split('-')[0];
  const partial = voices.find((voice) => normalizeTag(voice.lang).startsWith(base));
  return partial ?? voices[0];
}

export function speak(text: string, lang?: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis as Synth;
  if (!synth) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  const desired = lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  utterance.lang = desired;
  utterance.rate = 1;
  const voices = ensureVoices(synth);
  const selected = pickVoice(voices, desired);
  if (selected) utterance.voice = selected;
  synth.cancel();
  synth.speak(utterance);
  return true;
}
