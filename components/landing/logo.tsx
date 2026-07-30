import Image from "next/image";
import { cn } from "@/lib/utils";

/** Mark only (no wordmark) — favicon, sidebar chips, compact UI. */
const MARK_SRC = "/brand/veyala-mark.png";
/** Full logo (mark + “Veyala”) — header, footer, auth. */
const LOGO_SRC = "/brand/veyala-logo-full.png";

/** Official Veyala monogram mark only (transparent background). */
export function VeyalaMark({ className }: { className?: string }) {
  return (
    <Image
      src={MARK_SRC}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}

/**
 * Official product logo.
 * - default: full horizontal logo (mark + wordmark)
 * - `markOnly`: monogram only
 * - `dark`: mark + white wordmark (for dark surfaces)
 */
export function VeyalaLogo({
  dark = false,
  markOnly = false,
  markClassName,
  wordmarkClassName,
  className,
}: {
  dark?: boolean;
  markOnly?: boolean;
  markClassName?: string;
  wordmarkClassName?: string;
  className?: string;
}) {
  if (markOnly) {
    return <VeyalaMark className={cn(className, markClassName)} />;
  }

  if (dark) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <VeyalaMark className={markClassName} />
        <span
          className={cn(
            "font-display text-xl font-bold tracking-tight text-white",
            wordmarkClassName
          )}
        >
          Veyala
        </span>
      </span>
    );
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="Veyala"
      width={140}
      height={36}
      className={cn("h-8 w-auto object-contain object-left", className, wordmarkClassName)}
      priority
    />
  );
}
