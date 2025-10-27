import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@/test-utils';
import QuickExitBar from '@/components/QuickExitBar';

const originalLocation = window.location;

describe('QuickExitBar', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  let closeSpy: ReturnType<typeof vi.spyOn>;
  let replaceSpy: ReturnType<typeof vi.spyOn>;
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
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
  });

  it('renders quick exit button', () => {
    render(<QuickExitBar />);
    expect(screen.getByRole('button', { name: /leave this site/i })).toBeInTheDocument();
    expect(screen.getByText(/need to leave quickly/i)).toBeInTheDocument();
  });

  it('opens safe destination when clicked', () => {
    render(<QuickExitBar />);
    const button = screen.getByRole('button', { name: /leave this site/i });
    fireEvent.click(button);

    expect(openSpy).toHaveBeenCalledWith('https://www.abc.net.au/news', '_blank', 'noopener,noreferrer');
    expect(replaceSpy).toHaveBeenCalledWith('https://www.abc.net.au/news');
    expect(closeSpy).toHaveBeenCalled();
  });
});
