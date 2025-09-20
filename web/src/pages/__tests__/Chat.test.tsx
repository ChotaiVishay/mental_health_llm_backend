import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Chat from '@/pages/Chat';

it('renders /chat when logged in', () => {
  render(
    <MemoryRouter initialEntries={['/chat']}>
      <AuthProvider initialState={{ user: { id: 'u1', name: 'Test User' } }}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  // Initial assistant message from Chat.tsx
  expect(screen.getByText(/how can i help you today/i)).toBeInTheDocument();
});