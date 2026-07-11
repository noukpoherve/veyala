import { cn } from "@/lib/utils";

/** Veyala "VY" monogram tile, recreated from the brand logo. */
export function VeyalaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 46 40" fill="none" aria-hidden className={cn("size-8 shrink-0", className)}>
      <defs>
        <linearGradient
          id="veyala-tile"
          x1="4"
          y1="36"
          x2="42"
          y2="4"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2E68D9" />
          <stop offset="0.55" stopColor="#3D7BE8" />
          <stop offset="1" stopColor="#54A0F6" />
        </linearGradient>
      </defs>
      <rect x="1" y="2" width="44" height="36" rx="11" fill="url(#veyala-tile)" />
      {/* v */}
      <path
        d="M10.5 11 L17.5 26 L24.5 11"
        stroke="#fff"
        strokeWidth="6.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* y — right arm + descender sweeping down-left */}
      <path
        d="M24.5 10 L31.5 23.5 M38.5 10 L31.5 23.5 C29.8 27.6 27.2 30.4 23.5 31.8"
        stroke="#fff"
        strokeWidth="6.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VeyalaLogo({
  dark = false,
  markClassName,
  wordmarkClassName,
}: {
  dark?: boolean;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <VeyalaMark className={markClassName} />
      <span
        className={cn(
          "font-display text-xl font-bold tracking-tight",
          dark ? "text-white" : "text-blue-600",
          wordmarkClassName
        )}
      >
        Veyala
      </span>
    </span>
  );
}
