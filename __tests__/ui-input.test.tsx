import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';

test('Input renders with placeholder', () => {
  render(<Input placeholder="Your name" />);
  expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
});
