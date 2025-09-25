// components/ui/card.tsx
import * as React from 'react';
import { cn } from '../../lib/utils'; // <-- If you use "@/lib/utils", change this to: import { cn } from "@/lib/utils";

/**
 * Basic typed wrapper props for card parts.
 * All components extend native div attributes so they accept events like onDragOver/onDrop.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg bg-white shadow-sm overflow-hidden', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

/* CardHeader */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-4 py-3 border-b', className)} {...props}>
        {children}
      </div>
    );
  },
);
CardHeader.displayName = 'CardHeader';

/* CardTitle */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn('text-sm font-semibold', className)} {...props}>
        {children}
      </h3>
    );
  },
);
CardTitle.displayName = 'CardTitle';

/* CardDescription (optional small text) */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('text-sm text-gray-500', className)} {...props}>
        {children}
      </div>
    );
  },
);
CardDescription.displayName = 'CardDescription';

/* CardContent — accepts drag/drop handlers and any div attributes */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-4', className)} {...props}>
        {children}
      </div>
    );
  },
);
CardContent.displayName = 'CardContent';

/* CardFooter */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-4 py-3 border-t', className)} {...props}>
        {children}
      </div>
    );
  },
);
CardFooter.displayName = 'CardFooter';

/* default export (optional): */
export default Card;
