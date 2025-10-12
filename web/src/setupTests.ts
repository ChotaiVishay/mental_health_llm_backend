import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * CSS stubs — jsdom can't parse our CSS vars/border shorthands. We don't assert styles in unit tests,
 * so return empty modules for CSS imports.
 */
vi.mock('@/styles/pages/login.css', () => ({}));
vi.mock('@/styles/pages/home.css', () => ({}));

/**
 * Smooth scroll helpers used by various components
 */
if (!('scrollTo' in window)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).scrollTo = () => {};
}
if (!('scrollTo' in window.HTMLElement.prototype)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.HTMLElement.prototype as any).scrollTo = () => {};
}
if (!('scrollIntoView' in window.HTMLElement.prototype)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.HTMLElement.prototype as any).scrollIntoView = () => {};
}

/**
 * matchMedia — Home.tsx checks prefers-reduced-motion
 */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false, // simulate "no reduced motion" by default
      media: query,
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
      // Legacy API
      addListener: () => {},
      removeListener: () => {},
      // Modern API
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/**
 * IntersectionObserver — reveal-on-view, etc.
 * Minimal no-op that satisfies the type/usage.
 */
if (typeof (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;

    constructor(
      _callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      void _callback;
      this.root = options?.root ?? null;
      this.rootMargin = options?.rootMargin ?? '';
      const t = options?.threshold ?? 0;
      this.thresholds = Array.isArray(t) ? t : [t];
    }

    observe(_target: Element): void { void _target; }
    unobserve(_target: Element): void { void _target; }
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }

  (globalThis as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver =
    MockIntersectionObserver;
}

/**
 * ResizeObserver — occasionally referenced; provide a tiny stub.
 */
if (typeof (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
  class MockResizeObserver implements ResizeObserver {
    constructor(_cb: ResizeObserverCallback) { void _cb; }
    observe(target: Element): void { void target; }
    unobserve(target: Element): void { void target; }
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;
}

/**
 * rAF — gentle animations fallback used by Home.tsx
 */
if (!(globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame) {
  (globalThis as unknown as {
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
  }).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;

  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (id: number) =>
    clearTimeout(id);
}

/**
 * speechSynthesis — noop shim for any TTS calls in tests.
 */
if (!(window as unknown as { speechSynthesis?: unknown }).speechSynthesis) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    getVoices: () => [],
    paused: false,
    pending: false,
    speaking: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    onvoiceschanged: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).SpeechSynthesisUtterance = function (this: unknown, text?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as any;
    self.text = text ?? '';
    self.lang = 'en-US';
    self.rate = 1;
    self.pitch = 1;
    self.volume = 1;
  };
}

export {};