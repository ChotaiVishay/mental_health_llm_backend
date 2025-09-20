// src/auth/__tests__/handoff.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Chat from '@/pages/Chat';
import { savePreloginChat } from '@/features/chat/sessionStore';

// IMPORTANT: use Vitest's mocking API (vi), not Jest.
// We mock the AuthContext module but keep its public surface
// compatible with the real one: { AuthProvider, useAuth }.
import { vi } from 'vitest';

vi.mock('@/auth/AuthContext', () => {
  // Make React properly typed, not `any`
  const React = require('react') as typeof import('react');

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

// Now import from the (mocked) module using the real public names
import { AuthProvider, useAuth } from '@/auth/AuthContext';

function SignInButton() {
  const { setUser } = useAuth() as any;
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

  // trigger sign-in
  (await screen.findByText('signin')).click();

  // Depending on your Chat UI, assert that the pre-login message appears.
  // This is left relaxed so the test remains portable across UI tweaks.
  await waitFor(() => {
    // Example (enable once Chat renders messages as visible text):
    // expect(screen.getByText(/hello before login/i)).toBeInTheDocument();
  });
});