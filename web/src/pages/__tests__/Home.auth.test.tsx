import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';
import { Providers } from '../../test-utils';

it('redirects to /login when starting chat while logged out', () => {
  // Ensure logged-out baseline
  localStorage.removeItem('sa_token');
  localStorage.removeItem('sa_user');

  render(
    <Providers router={{ initialEntries: ['/'] }}>
      <App />
    </Providers>
  );

  fireEvent.click(screen.getByText('Start Chat'));
  // We should now be on the login page
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});