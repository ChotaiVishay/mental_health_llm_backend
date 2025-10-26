import {
  afterEach, beforeEach, expect, it, vi,
} from 'vitest';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import Chat from '@/pages/Chat';
import { Providers } from '@/test-utils';
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

it('shows anonymous banner and toggles the conversation sidebar', async () => {
  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: null }}>
      <Chat />
    </Providers>
  );

  const termsCheckbox = await screen.findByLabelText(/I have read and agree/i);
  fireEvent.click(termsCheckbox);
  fireEvent.click(screen.getByLabelText(/I understand and accept/i));
  fireEvent.click(screen.getByRole('button', { name: /accept and continue/i }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

  // The banner uses curly apostrophes, so assert loosely on its role + contents
  expect(screen.getByRole('note')).toHaveTextContent(/chatting.*anonymous/i);

  // Hide the sidebar, then open it again with the hamburger
  fireEvent.click(screen.getByLabelText(/hide conversations/i));
  expect(screen.queryByText(/sign in to view/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText(/open chat history/i));
  expect(await screen.findByText(/sign in to view/i)).toBeInTheDocument();
});
