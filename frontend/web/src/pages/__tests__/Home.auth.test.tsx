import {
  afterEach, beforeEach, expect, it, vi,
} from 'vitest';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import { fetchAgreementStatus, acceptAgreements } from '@/api/agreements';

vi.mock('@/api/agreements', () => ({
  fetchAgreementStatus: vi.fn(),
  acceptAgreements: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchAgreementStatus).mockResolvedValue({
    termsVersion: '2025-02-17',
    privacyVersion: '2025-02-17',
    termsAccepted: false,
    privacyAccepted: false,
    requiresAcceptance: true,
  });
  vi.mocked(acceptAgreements).mockResolvedValue({
    termsVersion: '2025-02-17',
    privacyVersion: '2025-02-17',
    termsAccepted: true,
    privacyAccepted: true,
    requiresAcceptance: false,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

it('starts chat anonymously when logged out', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /^start chat —/i }));

  const termsCheckbox = await screen.findByLabelText(/I have read and agree/i);
  fireEvent.click(termsCheckbox);
  fireEvent.click(screen.getByLabelText(/I understand and accept/i));
  fireEvent.click(screen.getByRole('button', { name: /accept and continue/i }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

  // We should be on the Chat page, not /login.
  expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
});
