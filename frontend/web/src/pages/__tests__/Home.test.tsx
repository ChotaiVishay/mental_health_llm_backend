import {
  afterEach, beforeEach, expect, it, vi,
} from 'vitest';
import { useEffect } from 'react';
import {
  render, screen, fireEvent, waitFor, act,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import { fetchAgreementStatus, acceptAgreements } from '@/api/agreements';
import { sendMessageToAPI } from '@/api/chat';
import { LanguageProvider, useLanguage } from '@/i18n/LanguageProvider';
import type { SupportedLanguageCode } from '@/i18n/translations';

vi.mock('@/api/agreements', async () => {
  const actual = await vi.importActual<typeof import('@/api/agreements')>('@/api/agreements');
  return {
    ...actual,
    fetchAgreementStatus: vi.fn(),
    acceptAgreements: vi.fn(),
  };
});

vi.mock('@/api/chat', async () => {
  const actual = await vi.importActual<typeof import('@/api/chat')>('@/api/chat');
  return {
    ...actual,
    sendMessageToAPI: vi.fn(),
    fetchChatSessions: vi.fn(async () => []),
    fetchChatConversation: vi.fn(async () => []),
  };
});

function LanguageCapture({ onReady }: { onReady: (setter: (code: SupportedLanguageCode) => void) => void }) {
  const { setLanguage } = useLanguage();
  useEffect(() => {
    onReady(setLanguage);
  }, [onReady, setLanguage]);
  return null;
}

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

it('auto-sends quick prompt messages into chat', async () => {
  vi.mocked(sendMessageToAPI).mockResolvedValue({
    response: 'Assistance is on the way.',
    session_id: 'session-1',
    action: null,
  });

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

  const quickPrompt = await screen.findByRole('button', { name: /low-cost counselling/i });
  fireEvent.click(quickPrompt);

  await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());

  const termsCheckbox = await screen.findByLabelText(/I have read and agree/i);
  const privacyCheckbox = screen.getByLabelText(/I understand and accept/i);
  fireEvent.click(termsCheckbox);
  fireEvent.click(privacyCheckbox);
  fireEvent.click(screen.getByRole('button', { name: /accept and continue/i }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

  await waitFor(() => expect(sendMessageToAPI).toHaveBeenCalledTimes(1));
  const [payload] = vi.mocked(sendMessageToAPI).mock.calls[0];
  expect(payload).toBe('Low-cost counselling');

  expect(await screen.findByText('Low-cost counselling')).toBeInTheDocument();
  expect(await screen.findByText('Assistance is on the way.', undefined, { timeout: 3000 })).toBeInTheDocument();
});

it('re-renders localized sections when the language changes', async () => {
  let setter: ((code: SupportedLanguageCode) => void) | undefined;

  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <LanguageCapture onReady={(fn) => { setter = fn; }} />
        <Home />
      </MemoryRouter>
    </LanguageProvider>
  );

  expect(screen.getByRole('heading', { name: /help & crisis/i })).toBeInTheDocument();

  await waitFor(() => {
    expect(typeof setter).toBe('function');
  });

  await act(async () => {
    setter?.('es');
  });

  expect(await screen.findByRole('heading', { name: /ayuda y crisis/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /preguntas frecuentes/i })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /iniciar chat — no necesitas iniciar sesión/i }),
  ).toBeInTheDocument();
});
