// web/src/pages/__tests__/Services.responsive.test.tsx
import { it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Services from '@/pages/Services';

// We stub fetch to avoid network (same pattern as other tests)
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as Response
  );
});

it('toggles filters panel via mobile button', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Services />} />
      </Routes>
    </MemoryRouter>
  );

  // Robust: target the button via test id (no name collisions)
  const toggle = screen.getByTestId('filters-toggle') as HTMLButtonElement;

  // Robust: get the panel via its label, but restrict to the <aside>
  const panel = screen.getByLabelText(/filters/i, { selector: 'aside' });

  // Initially collapsed (aria-hidden on mobile)
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(panel).toHaveAttribute('aria-hidden', 'true');

  // Open
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(panel).not.toHaveAttribute('aria-hidden');

  // Close again
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(panel).toHaveAttribute('aria-hidden', 'true');
});