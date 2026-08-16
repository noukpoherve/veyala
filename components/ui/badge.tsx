import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        success: "border-transparent bg-success text-success-foreground shadow",
        warning: "border-transparent bg-warning text-warning-foreground shadow",
        // Soft/tinted tier — for dense contexts (table cells, inline status)
        // where a solid fill reads too loud. Same tokens as the solid
        // variants above, just at low opacity, so it stays in sync with them
        // (including in dark mode) instead of reaching for a literal
        // Tailwind color like bg-emerald-100.
        "success-soft": "border-transparent bg-success/10 text-success",
        "warning-soft": "border-transparent bg-warning/10 text-warning",
        "neutral-soft": "border-transparent bg-muted text-muted-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Inline badge — must be a <span>, never a <div>.
 * A <div> inside <p>/<h1> makes the browser rewrite the DOM → hydration errors.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
