import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '@/pages/Chat';
import { Providers } from '@/test-utils';

// mock the API to fail once
vi.mock('@/api/chat', () => ({
  sendMessageToAPI: vi.fn(async () => { throw new Error('Failed to fetch'); }),
}));

it('shows a friendly banner when API fails and keeps composer enabled', async () => {
  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: { id: 'u1', name: 'Test' } as any }}>
      <Chat />
    </Providers>
  );

  const box = await screen.findByPlaceholderText(/type your message/i);
  fireEvent.change(box, { target: { value: 'Hello' } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));

  // Friendly banner appears
  await screen.findByText(/couldn’t reach the assistant|Network error/i);

  // Composer usable again
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
  );
});