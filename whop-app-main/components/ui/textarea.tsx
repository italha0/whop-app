import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[90px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted",
        "focus-visible:outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
