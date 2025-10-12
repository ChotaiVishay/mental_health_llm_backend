export function speak(text: string, lang?: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  u.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}