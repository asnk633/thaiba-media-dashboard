// components/ui/label.tsx
import React from 'react';

/**
 * Label component that forwards all native <label> props (including htmlFor)
 * Uses the built-in React type so any other label attributes are accepted.
 */
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

export function Label({ children, className = '', ...rest }: LabelProps) {
  return (
    <label
      {...rest}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
    </label>
  );
}

export default Label;
