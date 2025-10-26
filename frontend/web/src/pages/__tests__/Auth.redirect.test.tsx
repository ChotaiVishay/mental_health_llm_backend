import {
  afterEach, beforeEach, expect, it, vi,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import AuthCallback from '@/pages/AuthCallback';
import Chat from '@/pages/Chat';
import { fetchAgreementStatus, acceptAgreements } from '@/api/agreements';

// Mock the OAuth client so we don't depend on import.meta.env in tests
vi.mock('@/auth/client', () => ({
  // Pretend the callback parsing succeeded and asked us to go to /chat
  parseCallbackAndStore: vi.fn(async () => '/chat'),
}));

vi.mock('@/api/agreements', async () => {
  const actual = await vi.importActual<typeof import('@/api/agreements')>('@/api/agreements');
  return {
    ...actual,
    fetchAgreementStatus: vi.fn(),
    acceptAgreements: vi.fn(),
  };
});

beforeEach(() => {
  vi.mocked(fetchAgreementStatus).mockResolvedValue({
    termsVersion: 'test',
    privacyVersion: 'test',
    termsAccepted: true,
    privacyAccepted: true,
    requiresAcceptance: false,
  });
  vi.mocked(acceptAgreements).mockResolvedValue({
    termsVersion: 'test',
    privacyVersion: 'test',
    termsAccepted: true,
    privacyAccepted: true,
    requiresAcceptance: false,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

it('goes to /chat after OAuth callback with state=/chat (smoke)', async () => {
  render(
    <MemoryRouter initialEntries={['/auth/callback?token=dev&name=Tester&state=/chat']}>
      <AuthProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/chat" element={<Chat />} />
          {/* Optional: define "/" so a stray nav("/") won't crash */}
          <Route path="/" element={<div />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());

  // After the callback effect runs, we should land on Chat
  expect(await screen.findByRole('textbox', { name: /message/i })).toBeInTheDocument();
});
