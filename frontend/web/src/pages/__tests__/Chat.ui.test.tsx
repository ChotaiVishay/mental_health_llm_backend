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

it('defaults to a collapsed sidebar with floating toggle on narrow screens', async () => {
  const originalMatchMedia = window.matchMedia;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const isNarrow = query.includes('(max-width: 900px)');
    return {
      matches: isNarrow,
      media: query,
      onchange: null,
      addListener: (cb: (event: MediaQueryListEvent) => void) => {
        listeners.add(cb);
      },
      removeListener: (cb: (event: MediaQueryListEvent) => void) => {
        listeners.delete(cb);
      },
      addEventListener: (_event: 'change', cb: (event: MediaQueryListEvent) => void) => {
        listeners.add(cb);
      },
      removeEventListener: (_event: 'change', cb: (event: MediaQueryListEvent) => void) => {
        listeners.delete(cb);
      },
      dispatchEvent: (event: MediaQueryListEvent) => {
        listeners.forEach((cb) => cb(event));
        return true;
      },
    } as MediaQueryList;
  });

  try {
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

    expect(screen.getByRole('button', { name: /open chat history/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Conversations/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open chat history/i }));
    expect(await screen.findByRole('heading', { name: /Conversations/i })).toBeInTheDocument();
  } finally {
    window.matchMedia = originalMatchMedia;
    listeners.clear();
  }
});
