// components/ui/input.tsx
import React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`px-3 py-2 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export default Input;
