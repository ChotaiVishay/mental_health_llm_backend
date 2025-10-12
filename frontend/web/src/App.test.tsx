import { render, screen, within } from '@testing-library/react';
import { it, expect } from 'vitest';
import App from './App';
import { Providers } from './test-utils';

it('renders core navigation links in the header only', () => {
  render(
    <Providers router={{ initialEntries: ['/'] }}>
      <App />
    </Providers>
  );

  // Only look in the header’s Primary navigation (avoids footer duplicates)
  const nav = screen.getByRole('navigation', { name: /primary/i });

  ['Home', 'Chat', 'Services', 'Help & Crisis'].forEach((label) => {
    expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
  });

  // Admin isn’t part of the header nav anymore
  expect(within(nav).queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
});