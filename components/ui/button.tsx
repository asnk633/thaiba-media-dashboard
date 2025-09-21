import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "primary";
};

export default function Button({ variant = "default", className = "", children, ...props }: Props) {
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
