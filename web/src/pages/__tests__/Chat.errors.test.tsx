import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '@/pages/Chat';
import { Providers } from '@/test-utils';

// Force the API call to fail so we can assert the banner & composer behaviour
vi.mock('@/api/chat', () => ({
  sendMessageToAPI: vi.fn(async () => { throw new Error('Failed to fetch'); }),
}));

it('shows a friendly banner when API fails and keeps composer enabled', async () => {
  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: { id: 'u1', name: 'Test' } }}>
      <Chat />
    </Providers>
  );

  // Textbox is accessible via its label "Message" now
  const box = await screen.findByRole('textbox', { name: /message/i });
  fireEvent.change(box, { target: { value: 'Hello' } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));

  // Friendly error text appears
  await screen.findByText(/couldn’t reach the assistant|network error/i);

  // Composer remains usable
  await waitFor(() => expect(screen.getByRole('textbox', { name: /message/i })).not.toBeDisabled());
});