import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import App from './App';
import { Providers } from './test-utils';

it('renders core navigation links', () => {
  render(
    <Providers router={{ initialEntries: ['/'] }}>
      <App />
    </Providers>
  );

  // Adjust these labels if your Header text differs
  ['Home', 'Chat', 'Services', 'Help & Crisis', 'Admin'].forEach((t) => {
    expect(screen.getByText(t)).toBeInTheDocument();
  });
});