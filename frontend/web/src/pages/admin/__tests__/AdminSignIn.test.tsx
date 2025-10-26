import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSignIn from '../AdminSignIn';
import * as AdminAuthContext from '@/admin/AdminAuthContext';

const loginMock = vi.fn().mockResolvedValue({ ok: true });

describe('AdminSignIn', () => {
  beforeEach(() => {
    loginMock.mockReset().mockResolvedValue({ ok: true });
    vi.spyOn(AdminAuthContext, 'useAdminAuth').mockReturnValue({
      admin: null,
      loading: false,
      error: null,
      login: loginMock,
      logout: vi.fn(),
      refresh: vi.fn(),
      reload: vi.fn(),
      updateProfile: vi.fn().mockResolvedValue({ ok: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form fields', () => {
    render(
      <MemoryRouter initialEntries={['/admin/signin']}>
        <AdminSignIn />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits credentials via context', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/signin']}>
        <AdminSignIn />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email or username/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(loginMock).toHaveBeenCalledWith('admin@example.com', 'Passw0rd!');
  });
});
