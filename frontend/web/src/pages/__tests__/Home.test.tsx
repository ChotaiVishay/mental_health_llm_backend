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

it('shows Start Chat and navigates (when logged in)', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider initialState={{ user: { id: 'u1', name: 'Test User' } }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /^start chat —/i }));
  await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());
  expect(await screen.findByRole('textbox', { name: /message/i })).toBeInTheDocument();
});
