import '@testing-library/jest-dom/vitest';

// Polyfill scrollTo for jsdom so components can call it safely in tests
if (!('scrollTo' in window.HTMLElement.prototype)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.HTMLElement.prototype as any).scrollTo = () => {};
}