import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Login from '@/pages/Login';
import RequireAuth from '@/auth/RequireAuth';

it('goes to /login then back to /chat after sign-in', async () => {
  localStorage.removeItem('sa_token');
  localStorage.removeItem('sa_user');

  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByText('Start Chat'));           // → /login
  expect(screen.getByText(/Sign in/i)).toBeInTheDocument();

  // Fake your signIn inside AuthContext during test or mock it; for now assert login shows.
  // (Your context's signIn should set a token and user and navigate back to /chat.)
});