import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

it('renders and handles click', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(onClick).toHaveBeenCalledTimes(1);
});