import * as React from "react"
import { cn } from "../../lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const labelVariants = cva("font-medium", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
    intent: {
      normal: "text-gray-700",
      error: "text-red-600",
      muted: "text-gray-500",
    },
  },
  defaultVariants: {
    size: "sm",
    intent: "normal",
  },
})

export type LabelVariantProps = VariantProps<typeof labelVariants>

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    LabelVariantProps {}

export function Label({
  children,
  className,
  size,
  intent,
  ...props
}: LabelProps) {
  return (
    <label className={cn(labelVariants({ size, intent }), className)} {...props}>
      {children}
    </label>
  )
}

export default Label
