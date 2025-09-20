import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Login from '@/pages/Login';

it('mock login button renders', () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
  expect(screen.getByText('Continue with Google')).toBeInTheDocument();
});