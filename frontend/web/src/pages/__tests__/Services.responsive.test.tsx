// web/src/pages/__tests__/Services.responsive.test.tsx
import { it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Force mobile for this test so the toggle renders
vi.mock('@/hooks/useMediaQuery', () => ({
  default: () => true,
}));

import Services from '@/pages/Services';

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

  // Button and panel have the same label; disambiguate with selector
  const toggle = screen.getByLabelText(/filters/i, { selector: 'button' });
  const panel  = screen.getByLabelText(/filters/i, { selector: 'aside' });

  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(panel).toHaveAttribute('aria-hidden', 'true');

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(panel).not.toHaveAttribute('aria-hidden');

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(panel).toHaveAttribute('aria-hidden', 'true');
});