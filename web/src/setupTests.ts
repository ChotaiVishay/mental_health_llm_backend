import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock styles that jsdom/cssstyle can't parse (e.g., border: 1px solid var(...)).
// We don't need CSS in behavior tests, so stub the module to an empty object.
vi.mock('@/styles/pages/login.css', () => ({}));

// scrollTo (used by Services.tsx for "back to top" button)
if (!('scrollTo' in window.HTMLElement.prototype)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.HTMLElement.prototype as any).scrollTo = () => {};
}

// matchMedia (used by Home.tsx)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
      // Legacy listeners some libs still call:
      addListener: () => {},
      removeListener: () => {},
      // Modern API:
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// IntersectionObserver (used by Home.tsx for reveals/parallax)
// Minimal, no-op implementation sufficient for tests
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


// ResizeObserver — some components guard for it, but add a tiny mock for tests
if (typeof (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
  class MockResizeObserver implements ResizeObserver {
    constructor(_cb: ResizeObserverCallback) { void _cb; }
    observe(target: Element): void { void target; }
    unobserve(target: Element): void { void target; }
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;
}

// requestAnimationFrame fallback (used by smooth animations in Home.tsx)
if (!(globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame) {
  (globalThis as unknown as {
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
  }).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;

  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (id: number) =>
    clearTimeout(id);
}

// Very small speechSynthesis shim so playing TTS in tests is a no-op
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

  // Minimal constructor
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