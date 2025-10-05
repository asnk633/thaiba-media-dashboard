import { render, screen } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

test('Textarea renders with placeholder', () => {
  render(<Textarea placeholder="Type here" />);
  expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
});
