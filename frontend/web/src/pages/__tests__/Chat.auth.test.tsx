import {
  afterEach, beforeEach, expect, it, vi,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';

// 👇 Mock RequireAuth to just render its children
vi.mock('@/auth/RequireAuth', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RequireAuth from '@/auth/RequireAuth';
import Chat from '@/pages/Chat';
import { fetchAgreementStatus, acceptAgreements } from '@/api/agreements';

vi.mock('@/api/agreements', async () => {
  const actual = await vi.importActual<typeof import('@/api/agreements')>('@/api/agreements');
  return {
    ...actual,
    fetchAgreementStatus: vi.fn(),
    acceptAgreements: vi.fn(),
  };
});

beforeEach(() => {
  vi.mocked(fetchAgreementStatus).mockResolvedValue({
    termsVersion: 'test',
    privacyVersion: 'test',
    termsAccepted: true,
    privacyAccepted: true,
    requiresAcceptance: false,
  });
  vi.mocked(acceptAgreements).mockResolvedValue({
    termsVersion: 'test',
    privacyVersion: 'test',
    termsAccepted: true,
    privacyAccepted: true,
    requiresAcceptance: false,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

it('renders /chat when logged in', async () => {
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
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  await waitFor(() => expect(fetchAgreementStatus).toHaveBeenCalled());
  expect(await screen.findByText(/How can I help you today/i)).toBeInTheDocument();
});
