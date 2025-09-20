import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';
import { it, expect, vi} from 'vitest';

it('renders and handles click', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(onClick).toHaveBeenCalledTimes(1);
});