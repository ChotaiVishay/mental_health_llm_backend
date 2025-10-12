import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config so we have a stable URL to assert on
vi.mock('@/config/admin', () => ({
  ADMIN_CONSOLE_URL: 'http://backend.test/admin/',
}));

import AdminIndex from '@/pages/admin/AdminIndex';

describe('AdminIndex (/admin)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // JSDOM’s window.location is read-only; replace it with a spy-able object
    // Keep other properties intact to avoid side effects.
    // @ts-expect-error – we are intentionally overriding for tests
    delete window.location;
    // @ts-expect-error – assign a partial mock
    window.location = {
      ...originalLocation,
      assign: vi.fn(),
    };
  });

  afterEach(() => {
    // Restore the original location object
    // @ts-expect-error – restore real object
    window.location = originalLocation;
  });

  it('navigates to Django Admin via window.location.assign', () => {
    render(<AdminIndex />);
    expect(window.location.assign).toHaveBeenCalledWith('http://backend.test/admin/');
  });

  it('renders an a11y fallback link to Admin', () => {
    render(<AdminIndex />);
    const link = screen.getByRole('link', { name: /open django admin/i });
    expect(link).toHaveAttribute('href', 'http://backend.test/admin/');
  });
});