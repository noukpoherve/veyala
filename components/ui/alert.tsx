import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex gap-3 rounded-xl border p-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        error: "border-destructive/30 bg-destructive/10 text-destructive",
        warning: "border-amber-300/80 bg-amber-50 text-amber-950",
        success: "border-emerald-300/80 bg-emerald-50 text-emerald-900",
        info: "border-blue-200 bg-blue-50 text-blue-950",
      },
    },
    defaultVariants: { variant: "error" },
  }
);

const ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Short headline shown above the body. */
  title?: string;
  /** Optional action (link/button) rendered under the body. */
  action?: React.ReactNode;
}

/**
 * Shared inline feedback banner. Errors use role="alert"; other tones use
 * role="status". Focusable (`tabIndex={-1}`) so callers can scrollIntoView + focus.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "error", title, action, children, ...props }, ref) => {
    const tone = variant ?? "error";
    const Icon = ICONS[tone];
    return (
      <div
        ref={ref}
        role={tone === "error" ? "alert" : "status"}
        tabIndex={-1}
        className={cn(alertVariants({ variant: tone }), className)}
        {...props}
      >
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          {title ? <p className="font-semibold leading-snug">{title}</p> : null}
          {children ? <div className="leading-relaxed [&_a]:underline">{children}</div> : null}
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { alertVariants };
