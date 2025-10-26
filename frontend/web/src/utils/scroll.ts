export function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth'): boolean {
  if (typeof document === 'undefined') return false;
  if (!hash) return false;
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!normalized) return false;
  const targetId = decodeURIComponent(normalized);
  const element = document.getElementById(targetId);
  if (!element) return false;

  window.requestAnimationFrame(() => {
    element.scrollIntoView({ behavior, block: 'start' });
  });

  return true;
}
