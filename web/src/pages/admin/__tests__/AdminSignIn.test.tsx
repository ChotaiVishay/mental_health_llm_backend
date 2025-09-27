import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock config helper so we can assert the exact hrefs.
// Apple is intentionally disabled (returns null) to verify conditional rendering.
vi.mock('@/config/admin', () => ({
  ADMIN_CONSOLE_URL: 'http://backend.test/admin/',
  getAdminOAuthUrl: (provider: 'google' | 'github' | 'apple') => {
    const next = encodeURIComponent('http://backend.test/admin/');
    if (provider === 'google') return `http://backend.test/auth/google/login/?next=${next}`;
    if (provider === 'github') return `http://backend.test/auth/github/login/?next=${next}`;
    return null; // apple disabled
  },
}));

import AdminSignIn from '@/pages/admin/AdminSignIn';

describe('AdminSignIn (/admin/signin)', () => {
  it('shows provider buttons with hrefs from helper and hides missing providers', () => {
    render(<AdminSignIn />);

    // Providers
    expect(
      screen.getByRole('link', { name: /continue with google/i })
    ).toHaveAttribute(
      'href',
      'http://backend.test/auth/google/login/?next=http%3A%2F%2Fbackend.test%2Fadmin%2F'
    );

    expect(
      screen.getByRole('link', { name: /continue with github/i })
    ).toHaveAttribute(
      'href',
      'http://backend.test/auth/github/login/?next=http%3A%2F%2Fbackend.test%2Fadmin%2F'
    );

    expect(
      screen.queryByRole('link', { name: /continue with apple/i })
    ).not.toBeInTheDocument(); // disabled via mock

    // Fallback link
    expect(
      screen.getByRole('link', { name: /open admin console/i })
    ).toHaveAttribute('href', 'http://backend.test/admin/');
  });
});