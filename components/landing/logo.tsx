import Image from "next/image";
import { cn } from "@/lib/utils";

const MARK_SRC = "/brand/veyala-mark.png";
const LOGO_SRC = "/brand/veyala-logo-full.png";

/** Official Veyala monogram mark (rounded tile). */
export function VeyalaMark({ className }: { className?: string }) {
  return (
    <Image
      src={MARK_SRC}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0", className)}
      aria-hidden
    />
  );
}

/** Official Veyala logo: mark + wordmark. */
export function VeyalaLogo({
  dark = false,
  markClassName,
  wordmarkClassName,
  className,
}: {
  dark?: boolean;
  markClassName?: string;
  wordmarkClassName?: string;
  className?: string;
}) {
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
      className={cn("h-8 w-auto", className, wordmarkClassName, markClassName)}
      priority
    />
  );
}
