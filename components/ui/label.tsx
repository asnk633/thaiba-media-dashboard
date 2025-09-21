// components/ui/label.tsx
import React from "react";

export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>{children}</label>;
}

export default Label;
