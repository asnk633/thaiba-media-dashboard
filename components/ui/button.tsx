// components/ui/button.tsx
import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "primary";
};

export function Button({ variant = "default", className = "", children, ...props }: ButtonProps) {
  const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition";
  const variantClass =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : variant === "ghost"
      ? "bg-transparent border border-gray-200 hover:bg-gray-50"
      : "bg-gray-100 text-gray-800 hover:bg-gray-200";

  return (
    <button className={`${base} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
