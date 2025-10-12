import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';

// 👇 Mock RequireAuth to just render its children
vi.mock('@/auth/RequireAuth', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RequireAuth from '@/auth/RequireAuth';
import Chat from '@/pages/Chat';

it('renders /chat when logged in', () => {
  render(
    <MemoryRouter initialEntries={['/chat']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
});