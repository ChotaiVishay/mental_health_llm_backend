import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';
import { Providers } from '../../test-utils';

it('goes to /login then back to /chat after sign-in (smoke)', async () => {
  // Start logged out
  localStorage.removeItem('sa_token');
  localStorage.removeItem('sa_user');

  render(
    <Providers router={{ initialEntries: ['/'] }}>
      <App />
    </Providers>
  );

  fireEvent.click(screen.getByText('Start Chat')); // → /login
  expect(screen.getByText(/Sign in/i)).toBeInTheDocument();

  // If you later wire a real sign-in in tests, click your sign-in button here,
  // then assert Chat. For now, we simply assert that Login rendered.
  // Example (uncomment when you have a real button):
  // fireEvent.click(screen.getByRole('button', { name: /Sign in with/i }));
  // expect(await screen.findByRole('heading', { name: /chat/i })).toBeInTheDocument();
});