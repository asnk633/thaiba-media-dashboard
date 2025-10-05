import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

test('Badge shows text', () => {
  render(<Badge>New</Badge>);
  expect(screen.getByText('New')).toBeInTheDocument();
});
