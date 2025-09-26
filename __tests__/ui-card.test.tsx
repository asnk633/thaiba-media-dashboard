import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';

test('Card renders header, content and footer', () => {
  render(
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Small description</CardDescription>
      </CardHeader>
      <CardContent>Body content</CardContent>
      <CardFooter>Footer text</CardFooter>
    </Card>,
  );

  expect(screen.getByText('Card Title')).toBeInTheDocument();
  expect(screen.getByText('Small description')).toBeInTheDocument();
  expect(screen.getByText('Body content')).toBeInTheDocument();
  expect(screen.getByText('Footer text')).toBeInTheDocument();
});
