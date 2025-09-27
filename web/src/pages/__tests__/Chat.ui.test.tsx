import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Chat from '@/pages/Chat';
import { Providers } from '@/test-utils';

it('shows anonymous banner and toggles the conversation sidebar', async () => {
  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: null }}>
      <Chat />
    </Providers>
  );

  // The banner uses curly apostrophes, so assert loosely on its role + contents
  expect(screen.getByRole('note')).toHaveTextContent(/chatting.*anonymous/i);

  // Hide the sidebar, then open it again with the hamburger
  fireEvent.click(screen.getByLabelText(/hide conversations/i));
  expect(screen.queryByText(/sign in to view/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText(/open chat history/i));
  expect(await screen.findByText(/sign in to view/i)).toBeInTheDocument();
});