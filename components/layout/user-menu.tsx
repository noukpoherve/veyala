"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronsUpDown,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const THEME_KEY = "veyala:theme";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Préférence système", icon: Monitor },
];

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function Avatar({ name, email, image }: { name: string | null; email: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className="size-9 shrink-0 rounded-full object-cover" />;
  }
  const initials = (name ?? email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
      {initials}
    </span>
  );
}

export function UserMenu({
  name,
  email,
  image,
  signOutAction,
}: {
  name: string | null;
  email: string;
  image: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const selectTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 rounded-xl bg-muted/70 p-2.5 text-left transition-colors hover:bg-muted"
      >
        <Avatar name={name} email={email} image={image} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {name ?? email.split("@")[0]}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl shadow-blue-900/10"
        >
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Avatar name={name} email={email} image={image} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">
                {name ?? email.split("@")[0]}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
          </div>

          <div className="p-2">
            <p className="px-3 pb-1 pt-2 text-sm font-semibold text-foreground">
              Thème de l&apos;interface
            </p>
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={theme === option.value}
                onClick={() => selectTheme(option.value)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <option.icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-left">{option.label}</span>
                {theme === option.value ? (
                  <Check className="size-4 text-foreground" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>

          <div className="border-t border-border p-2">
            <Link
              href="/support"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              Nous contacter
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="size-4 text-muted-foreground" aria-hidden />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
