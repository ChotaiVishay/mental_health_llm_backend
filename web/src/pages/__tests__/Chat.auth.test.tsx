import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Chat from '@/pages/Chat';
import RequireAuth from '@/auth/RequireAuth';

it('renders /chat when logged in', () => {
  localStorage.setItem('sa_token', 'x');
  localStorage.setItem('sa_user', JSON.stringify({ id: 'u1', name: 'Test' }));

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
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
});