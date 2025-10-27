import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test-utils';
import Profile from '@/pages/Profile';

const updateUserMock = vi.fn();
const signOutMock = vi.fn();
const deleteUserMock = vi.fn();
const setUserMock = vi.fn();
const originalLocation = window.location;

const mockSupabaseUser = {
  id: 'user-123',
  email: 'updated@example.com',
  user_metadata: {
    full_name: 'Updated Name',
    avatar_url: 'https://example.com/avatar.png',
  },
};

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'person@example.com',
      name: 'Taylor Swift',
      avatarUrl: '',
    },
    setUser: setUserMock,
  }),
}));

vi.mock('@/auth/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      updateUser: updateUserMock,
      signOut: signOutMock,
    },
  }),
}));

vi.mock('@/admin/supabaseAdminClient', () => ({
  getSupabaseAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: deleteUserMock,
      },
    },
  }),
}));

describe('Profile page', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        href: '',
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    updateUserMock.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null });
    signOutMock.mockResolvedValue(undefined);
    deleteUserMock.mockResolvedValue({ error: null });
    setUserMock.mockReset();
    window.location.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates profile basics', async () => {
    render(<Profile />);

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Updated Name' } });
    fireEvent.change(screen.getByLabelText(/avatar url/i), { target: { value: 'https://example.com/avatar.png' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(updateUserMock).toHaveBeenCalled());

    expect(updateUserMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.png',
      }),
    });

    await waitFor(() => expect(setUserMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Updated Name',
      avatarUrl: 'https://example.com/avatar.png',
    })));
  });

  it('deletes account after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Profile />);

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => expect(deleteUserMock).toHaveBeenCalledWith('user-123'));
    expect(signOutMock).toHaveBeenCalled();
    expect(setUserMock).toHaveBeenCalledWith(null);
    expect(window.location.href).toBe('/');

    confirmSpy.mockRestore();
  });
});
