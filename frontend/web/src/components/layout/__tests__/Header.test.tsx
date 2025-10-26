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
  const navs = screen.getAllByRole('navigation', { name: /primary/i });
  const desktopNav = navs.find((element) => element.getAttribute('data-variant') === 'desktop');

  if (!desktopNav) {
    throw new Error('Expected to find the desktop header navigation');
  }

  ['Home', 'Chat', 'Help & Crisis', 'FAQ'].forEach((label) => {
    expect(within(desktopNav).getByRole('link', { name: label })).toBeInTheDocument();
  });

  // Header no longer shows Admin
  expect(within(desktopNav).queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();

  const accessibilityLinks = screen.getAllByRole('link', { name: /accessibility/i });
  expect(accessibilityLinks.length).toBeGreaterThanOrEqual(1);
});
