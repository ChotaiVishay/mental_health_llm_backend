import {
  afterEach, beforeEach, describe, expect, it, vi, type MockedFunction,
} from 'vitest';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import Chat from '@/pages/Chat';
import { fetchAgreementStatus, acceptAgreements } from '@/api/agreements';
import type { TranslationResult } from '@/features/translation/translator';

vi.mock('@/api/agreements', async () => {
  const actual = await vi.importActual<typeof import('@/api/agreements')>('@/api/agreements');
  return {
    ...actual,
    fetchAgreementStatus: vi.fn(),
    acceptAgreements: vi.fn(),
  };
});

vi.mock('@/auth/AuthContext', () => {
  const React = require('react') as typeof import('react');
  type CtxShape = { user: { id: string; name: string } | null; loading: boolean; setUser: (u: unknown) => void };
  const Context = React.createContext<CtxShape>({
    user: { id: 'u1', name: 'Prueba' },
    loading: false,
    setUser: () => {},
  });
  const AuthProviderMock = ({ children }: { children: React.ReactNode }) => (
    <Context.Provider value={{ user: { id: 'u1', name: 'Prueba' }, loading: false, setUser: () => {} }}>
      {children}
    </Context.Provider>
  );
  const useAuth = () => React.useContext(Context);
  return { AuthProvider: AuthProviderMock, useAuth };
});

type TranslationFn = (text: string, language: string) => Promise<TranslationResult>;
type SendMessageFn = typeof import('@/api/chat').sendMessageToAPI;

const hoistedMocks = vi.hoisted(() => ({
  translateToEnglishMock: vi.fn(),
  translateFromEnglishMock: vi.fn(),
  sendMessageMock: vi.fn(),
}));

vi.mock('@/features/translation/translator', () => ({
  translateToEnglish: hoistedMocks.translateToEnglishMock,
  translateFromEnglish: hoistedMocks.translateFromEnglishMock,
}));

vi.mock('@/api/chat', async () => {
  const actual = await vi.importActual<typeof import('@/api/chat')>('@/api/chat');
  return {
    ...actual,
    sendMessageToAPI: hoistedMocks.sendMessageMock,
    fetchChatSessions: vi.fn(async () => []),
    fetchChatConversation: vi.fn(async () => []),
  };
});

const translateToEnglishMock = hoistedMocks.translateToEnglishMock as MockedFunction<TranslationFn>;
const translateFromEnglishMock = hoistedMocks.translateFromEnglishMock as MockedFunction<TranslationFn>;
const sendMessageMock = hoistedMocks.sendMessageMock as MockedFunction<SendMessageFn>;

beforeEach(() => {
  window.localStorage.setItem('support-atlas.language', 'es');
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
  translateToEnglishMock.mockReset();
  translateFromEnglishMock.mockReset();
  sendMessageMock.mockReset();
  vi.clearAllTimers();
  vi.useRealTimers();
});

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('Chat translations', () => {
  it('translates outgoing and incoming messages when a non-English language is selected', async () => {
    translateToEnglishMock.mockResolvedValue({ ok: true, text: 'affordable counselling' });
    translateFromEnglishMock.mockResolvedValue({ ok: true, text: 'respuesta en español' });
    sendMessageMock.mockResolvedValue({
      response: 'English response',
      session_id: 'session-es',
    });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/chat']}>
          <AuthProvider>
            <Routes>
              <Route path="/chat" element={<Chat />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </LanguageProvider>,
    );

    await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());
    const input = await screen.findByRole('textbox', { name: /mensaje/i });
    const sendButton = await screen.findByRole('button', { name: /enviar/i });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(input).not.toBeDisabled(), { timeout: 3000 });
    fireEvent.change(input, { target: { value: 'Hola necesito ayuda' } });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    await waitFor(() => expect(sendMessageMock).toHaveBeenCalledTimes(1));
    expect(sendMessageMock).toHaveBeenCalledWith('affordable counselling', null, 'en', 'u1');
    expect(translateToEnglishMock).toHaveBeenCalledWith('Hola necesito ayuda', 'es');
    expect(translateFromEnglishMock).toHaveBeenCalledWith('English response', 'es');

    const transcript = await screen.findByLabelText('Conversation');
    await waitFor(() => {
      expect(transcript.textContent).toContain('Hola necesito ayuda');
      expect(transcript.textContent).toMatch(/respuesta en español/i);
    });
  });

  it('falls back to the original language when translation is unavailable', async () => {
    translateToEnglishMock.mockResolvedValue({ ok: false, text: 'Hola' });
    translateFromEnglishMock.mockResolvedValue({ ok: false, text: 'Ignored' });
    sendMessageMock.mockResolvedValue({
      response: 'Respuesta directa del asistente',
      session_id: 'session-es',
    });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/chat']}>
          <AuthProvider>
            <Routes>
              <Route path="/chat" element={<Chat />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </LanguageProvider>,
    );

    await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());
    const input = await screen.findByRole('textbox', { name: /mensaje/i });
    const sendButton = await screen.findByRole('button', { name: /enviar/i });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(input).not.toBeDisabled(), { timeout: 3000 });
    fireEvent.change(input, { target: { value: 'Hola' } });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    await waitFor(() => expect(sendMessageMock).toHaveBeenCalledTimes(1));
    expect(sendMessageMock).toHaveBeenCalledWith('Hola', null, 'es', 'u1');
    expect(translateFromEnglishMock).not.toHaveBeenCalled();
    const transcript = await screen.findByLabelText('Conversation');
    await waitFor(() => {
      expect(transcript.textContent).toContain('Hola');
    });
    await waitFor(() => {
      const matches = screen.queryAllByText(
        (_content, element) => element?.textContent?.includes('Respuesta directa del asistente') ?? false,
      );
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});
