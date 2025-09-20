import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Chat from '@/pages/Chat';

it('renders /chat when logged in', () => {
  render(
    <MemoryRouter initialEntries={['/chat']}>
      <Routes>
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </MemoryRouter>
  );

  // Initial assistant message from Chat.tsx
  expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
});