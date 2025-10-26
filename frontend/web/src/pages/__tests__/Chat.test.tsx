import {
  afterEach, beforeEach, expect, it, vi,
} from 'vitest';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
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

it('renders chat when logged in and agreements are accepted', async () => {
  render(
    <MemoryRouter initialEntries={['/chat']}>
      <AuthProvider initialState={{ user: { id: 'u1', name: 'Test User' } }}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());
  expect(await screen.findByText(/how can i help you today/i)).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: /Please accept/ })).not.toBeInTheDocument();
});

it('asks anonymous users to accept on every visit', async () => {
  vi.mocked(fetchAgreementStatus).mockResolvedValue({
    termsVersion: '2025-02-17',
    privacyVersion: '2025-02-17',
    termsAccepted: false,
    privacyAccepted: false,
    requiresAcceptance: true,
  });

  render(
    <MemoryRouter initialEntries={['/chat']}>
      <AuthProvider>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  const termsCheckbox = await screen.findByLabelText(/I have read and agree/i);
  const privacyCheckbox = screen.getByLabelText(/I understand and accept/i);
  const acceptButton = screen.getByRole('button', { name: /Accept and continue/i });

  expect(acceptButton).toBeDisabled();

  fireEvent.click(termsCheckbox);
  fireEvent.click(privacyCheckbox);

  expect(acceptButton).toBeEnabled();
  fireEvent.click(acceptButton);

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(fetchAgreementStatus).toHaveBeenCalled();

  // Composer should now be enabled for anonymous chat
  expect(screen.getByRole('textbox', { name: /message/i })).not.toBeDisabled();
});
