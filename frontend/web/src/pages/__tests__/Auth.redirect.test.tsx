import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import AuthCallback from '@/pages/AuthCallback';
import Chat from '@/pages/Chat';

// Mock the OAuth client so we don't depend on import.meta.env in tests
vi.mock('@/auth/client', () => ({
  // Pretend the callback parsing succeeded and asked us to go to /chat
  parseCallbackAndStore: vi.fn(async () => '/chat'),
}));

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

  // After the callback effect runs, we should land on Chat
  expect(await screen.findByRole('textbox', { name: /message/i })).toBeInTheDocument();
});
