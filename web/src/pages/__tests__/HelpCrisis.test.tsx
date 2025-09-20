import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HelpCrisis from '@/pages/HelpCrisis';

it('renders crisis numbers and key headings', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<HelpCrisis />} />
      </Routes>
    </MemoryRouter>
  );

  // Headings
  expect(screen.getByText(/Need help right now\?/i)).toBeInTheDocument();
  expect(screen.getByText(/Quick help/i)).toBeInTheDocument();
  expect(screen.getByText(/Frequently asked/i)).toBeInTheDocument();

  // Crisis tel links (AU)
  expect(screen.getByRole('link', { name: /000/i })).toHaveAttribute('href', 'tel:000');
  expect(screen.getByRole('link', { name: /13 11 14/i })).toHaveAttribute('href', 'tel:131114');
  expect(screen.getByRole('link', { name: /1800 55 1800/i })).toHaveAttribute('href', 'tel:1800551800');
  expect(screen.getByRole('link', { name: /1300 22 4636/i })).toHaveAttribute('href', 'tel:1300224636');
});