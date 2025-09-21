import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return (
    <input
      {...props}
      className={`px-3 py-2 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none ${props.className ?? ""}`}
    />
  );
}
