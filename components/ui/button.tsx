// /components/ui/button.tsx
import * as React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      intent: {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 border-transparent',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-300 border-transparent',
        ghost: 'bg-transparent text-gray-900 hover:bg-gray-50 border-transparent',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 border-transparent',
        outline:
          'bg-transparent text-gray-900 hover:bg-gray-50 border-gray-300 focus-visible:ring-gray-300',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

/**
 * Accept both `intent` (new name) and `variant` (legacy name)
 */
type VariantType = ButtonVariantProps extends { intent?: infer I } ? I : string;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  variant?: VariantType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, variant, size, fullWidth, children, ...props }, ref) => {
    const resolvedIntent = (intent ?? variant ?? 'primary') as ButtonVariantProps['intent'];

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ intent: resolvedIntent, size, fullWidth }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
