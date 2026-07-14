"use client";

import { type ReactNode, useRef, useState } from "react";
import { ChevronDown, ImagePlus, RotateCcw } from "lucide-react";
import type { ColorsOverride, TemplateDefinition } from "@/lib/templates/definition";
import { fileToDataUrl } from "@/lib/image-file";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Every "look of the CV" control, grouped into collapsible sections so the
 * studio rail stays uncluttered: quick preset palettes, per-role colours, and
 * photo framing. Emits granular changes the editor merges into the CV's
 * StyleOverride and previews live.
 */

type PaletteColors = TemplateDefinition["colors"];

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

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-sm font-medium"
      >
        {title}
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t px-3.5 py-3.5">{children}</div> : null}
    </div>
  );
}

export function DesignControls({
  colors,
  photo,
  photoShape,
  hasPhoto,
  logo,
  hasOverride,
  onChangeColors,
  onChangePhoto,
  onChangePhotoShape,
  onChangeLogo,
  onReset,
}: {
  colors: PaletteColors;
  photo: boolean;
  photoShape: "circle" | "square";
  hasPhoto: boolean;
  logo?: string;
  hasOverride: boolean;
  onChangeColors: (patch: ColorsOverride) => void;
  onChangePhoto: (show: boolean) => void;
  onChangePhotoShape: (shape: "circle" | "square") => void;
  onChangeLogo: (dataUrl: string) => void;
  onReset: () => void;
}) {
  const logoInput = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Apparence
        </h3>
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
      </div>

      <Section title="Palettes rapides" defaultOpen>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active =
              colors.sidebar[0]?.toLowerCase() === p.sidebar.toLowerCase() &&
              colors.band.toLowerCase() === p.band.toLowerCase();
            return (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  onChangeColors({
                    sidebar: [p.sidebar],
                    band: p.band,
                    heading: p.heading,
                    bandText: "#ffffff",
                    sidebarText: "#ffffff",
                  })
                }
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
                  style={{ background: `linear-gradient(135deg, ${p.sidebar} 50%, ${p.band} 50%)` }}
                />
                {p.name}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Couleurs détaillées">
        <div className="grid grid-cols-1 gap-2.5">
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
                    onChange={(e) =>
                      onChangeColors(
                        role.array ? { sidebar: [e.target.value] } : { [role.key]: e.target.value }
                      )
                    }
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
      </Section>

      {hasPhoto ? (
        <Section title="Photo">
          <div className="space-y-3.5">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              Afficher la photo
              <input
                type="checkbox"
                checked={photo}
                onChange={(e) => onChangePhoto(e.target.checked)}
                className="size-4 accent-primary"
              />
            </label>
            {photo ? (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Forme</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["circle", "square"] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => onChangePhotoShape(shape)}
                      aria-pressed={photoShape === shape}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border py-3 text-xs font-medium transition-colors",
                        photoShape === shape
                          ? "border-primary ring-2 ring-primary/30"
                          : "hover:border-primary/40"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-8 border-2 border-current bg-muted",
                          shape === "circle" ? "rounded-full" : "rounded"
                        )}
                      />
                      {shape === "circle" ? "Ronde" : "Carrée"}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </div>
        </Section>
      ) : null}

      <Section title="Logo (école, entreprise…)">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Affiché en filigrane dans le coin supérieur droit du CV.
          </p>
          <input
            ref={logoInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) onChangeLogo(await fileToDataUrl(file, { max: 300, mime: "image/png" }));
              e.target.value = "";
            }}
          />
          {logo ? (
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo"
                className="size-14 rounded-md border bg-white object-contain p-1"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInput.current?.click()}
                >
                  Changer
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onChangeLogo("")}>
                  Retirer
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInput.current?.click()}
            >
              <ImagePlus />
              Ajouter un logo
            </Button>
          )}
        </div>
      </Section>
    </div>
  );
}
