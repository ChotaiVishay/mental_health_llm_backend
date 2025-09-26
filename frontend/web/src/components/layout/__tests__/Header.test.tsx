import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { it, expect } from 'vitest';

it('renders nav links', () => {
  render(<BrowserRouter><Header /></BrowserRouter>);
  ['Home', 'Chat', 'Services', 'Help & Crisis', 'Admin'].forEach(t => {
    expect(screen.getByText(t)).toBeInTheDocument();
  });
});