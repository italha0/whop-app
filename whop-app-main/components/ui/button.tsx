import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Clipgoat-style variants (dark-first, purple accent, subtle depth)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:border-transparent aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        
        // Primary: solid purple, hover lighter purple, subtle glow
        default: "bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_rgba(138,43,226,0.55)] hover:bg-primary-hover hover:shadow-[0_4px_18px_-4px_rgba(138,43,226,0.65)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline: muted text, border, hover card surface + foreground text
        outline: "border border-border bg-transparent text-foreground-muted hover:bg-card hover:text-foreground shadow-[0_0_0_1px_var(--border)]",
        secondary: "bg-background-light text-foreground hover:bg-background/70",
        // Ghost: transparent, muted text, hover card surface
        ghost: "text-foreground-muted hover:text-foreground hover:bg-card",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
