import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { AdminAuthProvider } from '@/admin/AdminAuthContext';
import AdminLayout from '../AdminLayout';

describe('AdminLayout', () => {
  it('renders navigation links', () => {
    render(
      <AuthProvider>
        <AdminAuthProvider
          hydrateOnMount={false}
          initialState={{
            admin: {
              id: '1',
              username: 'super',
              first_name: 'Super',
              last_name: 'Admin',
              email: 'super@example.com',
              is_active: true,
              date_joined: '2024-01-01T00:00:00Z',
              last_login: null,
              profile: { role: 'super_admin' },
            },
            loading: false,
          }}
        >
          <MemoryRouter initialEntries={['/admin']}>
            <AdminLayout />
          </MemoryRouter>
        </AdminAuthProvider>
      </AuthProvider>,
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
