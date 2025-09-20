import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Chat from '@/pages/Chat';

it('sends a message and shows assistant reply (mock)', () => {
  // seed auth so guard won’t redirect (rendering page directly here)
  localStorage.setItem('sa_token', 'x');
  localStorage.setItem('sa_user', JSON.stringify({ id: 'u1', name: 'Test' }));

  render(
    <MemoryRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  const textarea = screen.getByPlaceholderText('Type your message…');
  fireEvent.change(textarea, { target: { value: 'hello' } });
  fireEvent.click(screen.getByText('Send'));
  expect(screen.getByText(/You said: "hello"/)).toBeInTheDocument();
});