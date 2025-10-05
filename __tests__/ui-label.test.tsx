import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

test('Label associates to control', () => {
  render(
    <>
      <Label htmlFor="x">Email</Label>
      <input id="x" />
    </>,
  );
  expect(screen.getByText('Email')).toHaveAttribute('for', 'x');
});
