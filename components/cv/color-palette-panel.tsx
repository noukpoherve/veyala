"use client";

import { RotateCcw, Palette } from "lucide-react";
import type { StyleOverride, TemplateDefinition } from "@/lib/templates/definition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Colour customisation panel: curated preset palettes for one-click theming,
 * plus per-role colour pickers (headings, bands, sidebar, links…). Emits a
 * StyleOverride patch that the editor merges over the template palette and
 * previews live.
 */

type PaletteColors = TemplateDefinition["colors"];

/** Curated professional palettes; each sets the structural accent colours. */
const PRESETS: { name: string; sidebar: string; band: string; heading: string }[] = [
  { name: "Océan", sidebar: "#1f3550", band: "#56a8dc", heading: "#1f3550" },
  { name: "Émeraude", sidebar: "#0f3d2e", band: "#10b981", heading: "#0f3d2e" },
  { name: "Bordeaux", sidebar: "#4c1d24", band: "#b03a4a", heading: "#4c1d24" },
  { name: "Ardoise", sidebar: "#1e293b", band: "#64748b", heading: "#0f172a" },
  { name: "Améthyste", sidebar: "#3b1f4e", band: "#8b5cf6", heading: "#3b1f4e" },
  { name: "Graphite", sidebar: "#262626", band: "#525252", heading: "#171717" },
  { name: "Corail", sidebar: "#7c2d12", band: "#f97316", heading: "#7c2d12" },
  { name: "Nuit", sidebar: "#0b1220", band: "#3b82f6", heading: "#0b1220" },
];

const ROLES: { key: keyof PaletteColors; label: string; array?: boolean }[] = [
  { key: "heading", label: "Titres" },
  { key: "band", label: "Bandeaux / accents" },
  { key: "bandText", label: "Texte des bandeaux" },
  { key: "sidebar", label: "Barre latérale", array: true },
  { key: "sidebarText", label: "Texte barre latérale" },
  { key: "link", label: "Liens" },
  { key: "body", label: "Texte courant" },
];

export function ColorPalettePanel({
  colors,
  hasOverride,
  onChange,
  onReset,
}: {
  colors: PaletteColors;
  hasOverride: boolean;
  onChange: (patch: StyleOverride) => void;
  onReset: () => void;
}) {
  function applyPreset(p: (typeof PRESETS)[number]) {
    onChange({
      sidebar: [p.sidebar],
      band: p.band,
      heading: p.heading,
      bandText: "#ffffff",
      sidebarText: "#ffffff",
    });
  }

  function setColor(key: keyof PaletteColors, array: boolean | undefined, value: string) {
    onChange(array ? { sidebar: [value] } : { [key]: value });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="size-4 text-primary" aria-hidden />
          Couleurs
        </CardTitle>
        {hasOverride ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Réinitialiser
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Palettes rapides</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active =
                colors.sidebar[0]?.toLowerCase() === p.sidebar.toLowerCase() &&
                colors.band.toLowerCase() === p.band.toLowerCase();
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  title={p.name}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm",
                    active ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40"
                  )}
                >
                  <span
                    aria-hidden
                    className="size-4 rounded-full border"
                    style={{
                      background: `linear-gradient(135deg, ${p.sidebar} 50%, ${p.band} 50%)`,
                    }}
                  />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ROLES.map((role) => {
            const value = role.array ? colors.sidebar[0]! : (colors[role.key] as string);
            return (
              <label
                key={role.key}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-accent/40"
              >
                <span className="relative size-7 shrink-0 overflow-hidden rounded-md border shadow-sm">
                  <span aria-hidden className="absolute inset-0" style={{ background: value }} />
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setColor(role.key, role.array, e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    aria-label={`Couleur : ${role.label}`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{role.label}</span>
                  <span className="block font-mono text-[11px] uppercase text-muted-foreground">
                    {value}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
