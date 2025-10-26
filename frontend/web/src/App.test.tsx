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

  const navs = screen.getAllByRole('navigation', { name: /primary/i });
  const nav = navs.find((element) => element.getAttribute('data-variant') === 'desktop');

  if (!nav) {
    throw new Error('Expected to find the desktop header navigation');
  }

  ['Home', 'Chat', 'Help & Crisis', 'FAQ'].forEach((label) => {
    expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
  });

  // Admin isn’t part of the header nav anymore
  expect(within(nav).queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
});
