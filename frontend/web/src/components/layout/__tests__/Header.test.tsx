import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { it, expect } from 'vitest';

it('renders primary nav links (no Admin in header)', () => {
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );

  // Scope to the header’s primary navigation so footer links don’t interfere
  const nav = screen.getByRole('navigation', { name: /primary/i });

  ['Home', 'Chat', 'Help & Crisis', 'FAQ'].forEach((label) => {
    expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
  });

  // Header no longer shows Admin
  expect(within(nav).queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
});
