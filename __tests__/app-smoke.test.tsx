import { render, screen } from '@testing-library/react';

function Demo() {
  return <h1>Hello, Thaiba!</h1>;
}

test('renders greeting', () => {
  render(<Demo />);
  expect(screen.getByText('Hello, Thaiba!')).toBeInTheDocument();
});
