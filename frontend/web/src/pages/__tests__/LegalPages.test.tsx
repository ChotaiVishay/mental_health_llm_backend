import { render, screen } from '@/test-utils';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';

describe('Legal pages', () => {
  it('renders Terms of Service content and table of contents', () => {
    render(<Terms />);

    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1\. overview/i })).toHaveAttribute('href', '#overview');
    expect(screen.getByText(/support atlas provides information/i)).toBeInTheDocument();
  });

  it('renders Privacy Policy content with update notice', () => {
    render(<Privacy />);

    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/we do not sell personal information/i)).toBeInTheDocument();
    expect(screen.getByText(/this policy will be updated/i)).toBeInTheDocument();
  });
});
