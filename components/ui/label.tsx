import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva("font-medium leading-none", {
  variants: {
    variant: {
      default: "",
    },
    size: {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export type LabelVariantProps = VariantProps<typeof labelVariants>

// Make LabelProps include all native label attributes so `htmlFor`, `onClick`, etc. are accepted.
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, LabelVariantProps {}

export function Label({
  className,
  children,
  variant,
  size,
  ...props
}: LabelProps) {
  return (
    <label className={cn(labelVariants({ variant, size, className }))} {...props}>
      {children}
    </label>
  )
}

export default Label
