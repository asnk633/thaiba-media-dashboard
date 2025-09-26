import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('Button renders children text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});
