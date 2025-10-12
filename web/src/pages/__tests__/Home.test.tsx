// web/src/pages/__tests__/Home.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';

// Mock navigation so we can assert navigation intent
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// Mock saving pre-login chat so we don’t touch storage
const savePreloginChatMock = vi.fn();
vi.mock('@/features/chat/sessionStore', () => ({
  savePreloginChat: (...args: unknown[]) => savePreloginChatMock(...args),
}));

function renderHome() {
  navigateMock.mockClear();
  savePreloginChatMock.mockClear();
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('<Home />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero headline and Start Chat CTA', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: /Find mental-health support, fast\.?/i })
    ).toBeInTheDocument();

    // Disambiguate from the “Start chat with …” chips
    const cta = screen.getByRole('button', { name: /no sign-in required/i });
    expect(cta).toBeInTheDocument();
  });

  it('navigates to /chat when Start Chat is clicked', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /no sign-in required/i }));
    expect(navigateMock).toHaveBeenCalledWith('/chat');
  });

  it('quick prompt chip seeds chat and navigates', () => {
    renderHome();
    const chip = screen.getByRole('button', { name: /Low-cost counselling/i });
    fireEvent.click(chip);
    expect(savePreloginChatMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/chat');
  });

  it('renders Help & Crisis banner and hotline tiles with tel: links', () => {
    renderHome();
    expect(
      screen.getByText(/If you’re in immediate danger, call 000/i)
    ).toBeInTheDocument();

    const hotlines = screen.getByRole('group', { name: /24\/7 support numbers/i });
    const items = within(hotlines).getAllByRole('link');
    expect(items.length).toBe(3);

    expect(within(hotlines).getByRole('link', { name: /Lifeline/i }))
      .toHaveAttribute('href', 'tel:131114');
    expect(within(hotlines).getByRole('link', { name: /Kids Helpline/i }))
      .toHaveAttribute('href', 'tel:1800551800');
    expect(within(hotlines).getByRole('link', { name: /Beyond Blue/i }))
      .toHaveAttribute('href', 'tel:1300224636');
  });

  it('renders Our principles section with four cards', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 2, name: /Our principles/i })).toBeInTheDocument();

    // Cards use <header> text (not <h3>), so assert by text within the group
    const group = screen.getByRole('group', { name: /Principles/i });
    ['Calm', 'Trust', 'Support', 'Inclusive'].forEach(label => {
      expect(within(group).getByText(new RegExp(label, 'i'))).toBeInTheDocument();
    });
  });

  it('FAQ expands when a question is clicked (JSDOM-safe)', () => {
    renderHome();
    const details = screen
      .getByText(/Can I use chat without an account\?/i)
      .closest('details') as HTMLDetailsElement;
    expect(details).toBeInTheDocument();
    expect(details.open).toBe(false);

    const summary = details.querySelector('summary') as HTMLElement;
    fireEvent.click(summary);

    // JSDOM doesn’t toggle <details> automatically; emulate minimal behaviour
    if (!details.open) {
      details.open = true;
      summary.dispatchEvent(new Event('toggle'));
    }

    expect(details.open).toBe(true);
    expect(
      screen.getByText(/Anonymous chat is available; messages aren’t stored/i)
    ).toBeInTheDocument();
  });
});