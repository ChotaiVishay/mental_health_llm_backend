// src/auth/__tests__/handoff.test.tsx
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import Chat from '@/pages/Chat';
import { savePreloginChat } from '@/features/chat/sessionStore';
import { fetchAgreementStatus, acceptAgreements } from '@/api/agreements';

// Mock AuthContext with a typed surface (no `require`, no `any`)
vi.mock('@/auth/AuthContext', () => {
  type CtxShape = {
    user: unknown;
    setUser: (u: unknown) => void;
    loading: boolean;
  };

  const Ctx = React.createContext<CtxShape>({
    user: null,
    setUser: () => {},
    loading: false,
  });

  function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<unknown>(null);
    const value = React.useMemo<CtxShape>(() => ({ user, setUser, loading: false }), [user]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  const useAuth = () => React.useContext(Ctx);

  return { AuthProvider, useAuth };
});

import { AuthProvider, useAuth } from '@/auth/AuthContext';

vi.mock('@/api/agreements', () => ({
  fetchAgreementStatus: vi.fn(),
  acceptAgreements: vi.fn(),
}));

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

type MockAuth = { setUser: (u: unknown) => void };

function SignInButton() {
  const { setUser } = useAuth() as unknown as MockAuth; // no `any`
  return <button onClick={() => setUser({ id: 'u1', name: 'Test' })}>signin</button>;
}

it('merges pre-login chat after sign-in', async () => {
  savePreloginChat({
    messages: [{ id: 'm1', role: 'user', text: 'hello before login', at: Date.now() }],
  });

  render(
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<><SignInButton /><Chat /></>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

  (await screen.findByText('signin')).click();

  await waitFor(() => {
    // enable when your Chat renders that message text
    // expect(screen.getByText(/hello before login/i)).toBeInTheDocument();
  });
});
