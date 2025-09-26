import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Chat from '@/pages/Chat';
import { Providers } from '@/test-utils';

it('shows sticky anonymous banner and opens drawer', async () => {
  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: null }}>
      <Chat />
    </Providers>
  );

  // Banner
  expect(screen.getByText(/you're chatting anonymously/i)).toBeInTheDocument();

  // Drawer toggle
  fireEvent.click(screen.getByLabelText(/open chat history/i));
  expect(await screen.findByRole('dialog', { name: /chat history/i })).toBeInTheDocument();
  expect(screen.getByText(/sign in to view/i)).toBeInTheDocument();
});