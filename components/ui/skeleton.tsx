import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-slate-200/70", className)}
      {...props}
    />
  );
}

export { Skeleton };
