import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Chat from '@/pages/Chat';
import RequireAuth from '@/auth/RequireAuth';

it('redirects to /login when starting chat while logged out', () => {
  localStorage.removeItem('sa_token');
  localStorage.removeItem('sa_user');

  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
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

  fireEvent.click(screen.getByText('Start Chat'));
  expect(screen.getByText(/sign in/i)).toBeInTheDocument(); // sees login page
});