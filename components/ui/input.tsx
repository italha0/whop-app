import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "flex h-9 w-full min-w-0 rounded-md border border-border bg-input px-3 py-1 text-sm md:text-sm text-foreground placeholder:text-foreground-muted selection:bg-primary selection:text-primary-foreground",
        // Transitions & disabled
        "transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:border-ring",
        // Error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
