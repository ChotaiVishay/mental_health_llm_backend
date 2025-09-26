import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import RequireAuth from '@/auth/RequireAuth';

function Login() { return <div>Sign in</div>; }

it('redirects unauthenticated user to /login', () => {
  // ensure logged out
  localStorage.clear();

  render(
    <MemoryRouter initialEntries={['/chat']}>
      <AuthProvider>
        <Routes>
          <Route path="/chat" element={<RequireAuth><div>Chat OK</div></RequireAuth>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  expect(screen.getByText('Sign in')).toBeInTheDocument();
});