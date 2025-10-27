import { useEffect } from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import {
  act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import QuickExitBar from '@/components/QuickExitBar';
import { LanguageProvider, useLanguage } from '@/i18n/LanguageProvider';
import type { SupportedLanguageCode } from '@/i18n/translations';

const originalLocation = window.location;

describe('QuickExitBar', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  let closeSpy: ReturnType<typeof vi.spyOn>;
  let replaceSpy: ReturnType<typeof vi.spyOn>;
  let randomSpy: ReturnType<typeof vi.spyOn>;

  function LanguageCapture({ onReady }: { onReady: (setter: (code: SupportedLanguageCode) => void) => void }) {
    const { setLanguage } = useLanguage();
    useEffect(() => {
      onReady(setLanguage);
    }, [onReady, setLanguage]);
    return null;
  }

  beforeEach(() => {
    window.localStorage.removeItem('support-atlas.language');
    openSpy = vi.spyOn(window, 'open').mockReturnValue({
      focus: vi.fn(),
    } as unknown as Window);
    closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace: vi.fn(),
        href: '',
      },
    });
    replaceSpy = vi.spyOn(window.location, 'replace');
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // Always choose first safe URL
  });

  afterEach(() => {
    openSpy.mockRestore();
    closeSpy.mockRestore();
    replaceSpy.mockRestore();
    randomSpy.mockRestore();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    window.localStorage.removeItem('support-atlas.language');
  });

  it('renders quick exit button', () => {
    render(<QuickExitBar />);
    expect(screen.getByRole('button', { name: /leave support atlas/i })).toBeInTheDocument();
    expect(screen.getByText(/need to leave quickly/i)).toBeInTheDocument();
  });

  it('opens safe destination when clicked', () => {
    render(<QuickExitBar />);
    const button = screen.getByRole('button', { name: /leave support atlas/i });
    fireEvent.click(button);

    expect(openSpy).toHaveBeenCalledWith('https://www.abc.net.au/news', '_blank', 'noopener,noreferrer');
    expect(replaceSpy).toHaveBeenCalledWith('https://www.abc.net.au/news');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('updates banner copy when language changes', async () => {
    let setter: ((code: SupportedLanguageCode) => void) | undefined;
    const handleReady = (fn: (code: SupportedLanguageCode) => void) => {
      setter = fn;
    };

    render(
      <LanguageProvider>
        <LanguageCapture onReady={handleReady} />
        <QuickExitBar />
      </LanguageProvider>
    );

    expect(screen.getByText(/need to leave quickly/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(typeof setter).toBe('function');
    });

    act(() => {
      setter?.('es');
    });

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('es-ES');
    });

    expect(await screen.findByText(/¿necesitas salir rápido\?/i)).toBeInTheDocument();
  });
});
