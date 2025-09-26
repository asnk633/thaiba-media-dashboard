import { render } from '@testing-library/react';
import Page from '@/app/page';

test('Home page renders without crashing', () => {
  const { container } = render(<Page />);
  // Just ensure something rendered; we don't assert exact text to keep it future-proof.
  expect(container.firstChild).toBeTruthy();
});
