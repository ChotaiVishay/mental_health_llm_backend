import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { it, expect } from 'vitest';
import Header from '@/components/layout/Header';
import { DyslexicModeProvider } from '@/accessibility/DyslexicModeContext';
import { EasyModeProvider } from '@/accessibility/EasyModeContext';
import { HighContrastModeProvider } from '@/accessibility/HighContrastModeContext';
import { ScreenReaderModeProvider } from '@/accessibility/ScreenReaderModeContext';
import { LargeTextModeProvider } from '@/accessibility/LargeTextModeContext';
import { ReducedMotionModeProvider } from '@/accessibility/ReducedMotionModeContext';

it('renders primary nav links (no Admin in header)', () => {
  render(
    <ReducedMotionModeProvider>
      <ScreenReaderModeProvider>
        <HighContrastModeProvider>
          <LargeTextModeProvider>
            <EasyModeProvider>
              <DyslexicModeProvider>
                <BrowserRouter>
                  <Header />
                </BrowserRouter>
              </DyslexicModeProvider>
            </EasyModeProvider>
          </LargeTextModeProvider>
        </HighContrastModeProvider>
      </ScreenReaderModeProvider>
    </ReducedMotionModeProvider>
  );

  // Scope to the header’s primary navigation so footer links don’t interfere
  const nav = screen.getByRole('navigation', { name: /primary/i });

  ['Home', 'Chat', 'Help & Crisis', 'FAQ'].forEach((label) => {
    expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
  });

  // Header no longer shows Admin
  expect(within(nav).queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();

  expect(screen.getByRole('link', { name: /accessibility/i })).toBeInTheDocument();
});
