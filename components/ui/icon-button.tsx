import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  /** Accessible name — required, this button has no visible text. */
  "aria-label": string;
  size?: "sm" | "default" | "lg";
}

const ICON_SIZE = {
  sm: "size-8",
  default: "size-9",
  lg: "size-11",
} as const;

/**
 * Square, icon-only button. Thin wrapper over Button (same variants, states,
 * loading spinner) — use instead of `size="icon"` when the intent needs to be
 * explicit in the markup, or a size Button's `icon` variant doesn't cover.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "default", variant = "ghost", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      className={cn(ICON_SIZE[size], "p-0", className)}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";

export { IconButton };
