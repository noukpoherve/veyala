import { cn } from "@/lib/utils";
import { hexLuminance, isLightHex } from "@/lib/color";
import type { TemplateDefinition } from "@/lib/templates/definition";

export interface SwatchProps {
  layout: "sidebar-left" | "single-column";
  colors: string[];
  band: string;
  sidebarText?: string;
  heading?: string;
  bandText?: string;
  photo?: boolean;
  photoShape?: "circle" | "square";
  headerStyle?: "band" | "underline";
  namePlacement?: "main" | "sidebar";
  skillsStyle?: "bricks" | "list" | "inline";
}

export type SwatchSize = "xs" | "sm" | "md" | "lg";

/** Maps a stored template definition onto the miniature preview. */
export function swatchFromDefinition(def: TemplateDefinition): SwatchProps {
  return {
    layout: def.layout,
    colors: def.colors.sidebar,
    band: def.colors.band,
    sidebarText: def.colors.sidebarText,
    heading: def.colors.heading,
    bandText: def.colors.bandText,
    photo: def.photo,
    photoShape: def.photoShape,
    headerStyle: def.headerStyle,
    namePlacement: def.namePlacement,
    skillsStyle: def.skillsStyle,
  };
}

const SIZE: Record<
  SwatchSize,
  {
    frame: string;
    pad: string;
    gap: string;
    photo: string;
    line: string;
    band: string;
    brick: string;
    name: string;
  }
> = {
  xs: {
    frame: "h-28 w-full",
    pad: "p-1",
    gap: "gap-0.5",
    photo: "size-4",
    line: "h-[2px]",
    band: "h-1.5",
    brick: "h-1 w-2.5",
    name: "h-1 w-2/3",
  },
  sm: {
    frame: "aspect-[210/297] w-full",
    pad: "p-1",
    gap: "gap-0.5",
    photo: "size-5",
    line: "h-[3px]",
    band: "h-2",
    brick: "h-1.5 w-3",
    name: "h-1.5 w-2/3",
  },
  md: {
    frame: "aspect-[210/297] w-full",
    pad: "p-1.5",
    gap: "gap-1",
    photo: "size-7",
    line: "h-1",
    band: "h-2.5",
    brick: "h-2 w-4",
    name: "h-2 w-2/3",
  },
  lg: {
    frame: "mx-auto aspect-[210/297] w-[min(100%,16rem)]",
    pad: "p-2",
    gap: "gap-1.5",
    photo: "size-9",
    line: "h-1.5",
    band: "h-3",
    brick: "h-2 w-6",
    name: "h-2.5 w-3/4",
  },
};

function withAlpha(hex: string, alpha: number): string {
  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (raw.length < 6) return hex;
  return `rgba(${parseInt(raw.slice(0, 2), 16)}, ${parseInt(raw.slice(2, 4), 16)}, ${parseInt(raw.slice(4, 6), 16)}, ${alpha})`;
}

function Line({
  width,
  color,
  className,
  heightClass,
}: {
  width: string;
  color: string;
  className?: string;
  heightClass: string;
}) {
  return (
    <span
      className={cn("block rounded-full", heightClass, className)}
      style={{ width, backgroundColor: color }}
    />
  );
}

function PhotoDot({
  shape,
  className,
  fill,
}: {
  shape: "circle" | "square";
  className: string;
  fill: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 border border-black/10",
        className,
        shape === "circle" ? "rounded-full" : "rounded-sm"
      )}
      style={{ backgroundColor: fill }}
    />
  );
}

function SectionHeader({
  band,
  headerStyle,
  bandClass,
  lineClass,
}: {
  band: string;
  headerStyle: "band" | "underline";
  bandClass: string;
  lineClass: string;
}) {
  if (headerStyle === "underline") {
    return (
      <span className="flex w-full flex-col gap-0.5">
        <Line width="55%" color={band} heightClass={lineClass} />
        <span className="h-px w-full" style={{ backgroundColor: band }} />
      </span>
    );
  }
  return (
    <span className={cn("w-full rounded-[2px]", bandClass)} style={{ backgroundColor: band }} />
  );
}

function SkillMarks({
  style,
  color,
  brickClass,
  lineClass,
}: {
  style: "bricks" | "list" | "inline";
  color: string;
  brickClass: string;
  lineClass: string;
}) {
  if (style === "bricks") {
    return (
      <span className="flex flex-wrap gap-0.5">
        <span className={cn("rounded-[1px]", brickClass)} style={{ backgroundColor: color }} />
        <span className={cn("rounded-[1px]", brickClass)} style={{ backgroundColor: color }} />
        <span
          className={cn("rounded-[1px] opacity-70", brickClass)}
          style={{ backgroundColor: color }}
        />
      </span>
    );
  }
  return (
    <span className="flex w-full flex-col gap-0.5">
      <Line width="90%" color={color} heightClass={lineClass} />
      <Line width="70%" color={color} heightClass={lineClass} />
      <Line width="80%" color={color} heightClass={lineClass} />
    </span>
  );
}

/**
 * Miniature layout preview built from a template definition. Sized and
 * structured like a tiny CV page so layout, photo, and colour bands stay
 * distinguishable when picking a template.
 */
export function TemplateSwatch({
  layout,
  colors,
  band,
  sidebarText = "#ffffff",
  heading = "#1f3550",
  bandText = "#ffffff",
  photo = false,
  photoShape = "square",
  headerStyle = "band",
  namePlacement = "main",
  skillsStyle = "inline",
  size = "md",
  className,
}: SwatchProps & { size?: SwatchSize; className?: string }) {
  const s = SIZE[size];
  const gradient = colors.length > 1 ? `linear-gradient(180deg, ${colors.join(", ")})` : colors[0];
  const sidebarFill = colors[0] ?? "#1f3550";
  const lightSidebar = isLightHex(sidebarFill);
  const lightBand = isLightHex(band);
  const sidebarPaint = lightSidebar && hexLuminance(sidebarFill) > 0.85 ? "#e2e8f0" : gradient;
  const photoFill = lightSidebar ? "#64748b" : "rgba(255,255,255,0.92)";
  const sideLine = lightSidebar ? withAlpha(sidebarText, 0.55) : withAlpha(sidebarText, 0.65);
  const bodyLine = "#64748b";
  const nameColor = lightBand && headerStyle === "band" ? heading : bandText;

  return (
    <span
      aria-hidden
      className={cn(
        "flex w-full overflow-hidden rounded-md border border-black/10 bg-white shadow-sm",
        s.frame,
        className
      )}
    >
      {layout === "sidebar-left" ? (
        <>
          <span
            className={cn(
              "flex h-full w-[34%] flex-col items-center",
              s.pad,
              s.gap,
              lightSidebar && "border-r"
            )}
            style={{
              background: sidebarPaint,
              borderColor: lightSidebar ? "#cbd5e1" : undefined,
              boxShadow: lightSidebar ? `inset 3px 0 0 ${band}` : undefined,
            }}
          >
            {photo ? <PhotoDot shape={photoShape} className={s.photo} fill={photoFill} /> : null}
            {namePlacement === "sidebar" ? (
              <Line width="80%" color={sidebarText} heightClass={s.name} className="self-stretch" />
            ) : null}
            <Line width="90%" color={sideLine} heightClass={s.line} className="self-stretch" />
            <Line width="70%" color={sideLine} heightClass={s.line} className="self-stretch" />
            <SkillMarks style={skillsStyle} color={band} brickClass={s.brick} lineClass={s.line} />
            <Line
              width="60%"
              color={sideLine}
              heightClass={s.line}
              className="mt-auto self-stretch"
            />
          </span>
          <span className={cn("flex h-full flex-1 flex-col bg-white", s.pad, s.gap)}>
            {namePlacement === "main" ? (
              <>
                <Line width="75%" color={heading} heightClass={s.name} />
                <Line width="45%" color={bodyLine} heightClass={s.line} />
              </>
            ) : (
              <Line width="70%" color={heading} heightClass={s.name} />
            )}
            <SectionHeader
              band={band}
              headerStyle={headerStyle}
              bandClass={s.band}
              lineClass={s.line}
            />
            <Line width="100%" color={bodyLine} heightClass={s.line} />
            <Line width="88%" color={bodyLine} heightClass={s.line} />
            <SectionHeader
              band={band}
              headerStyle={headerStyle}
              bandClass={s.band}
              lineClass={s.line}
            />
            <Line width="100%" color={bodyLine} heightClass={s.line} />
            <Line width="72%" color={bodyLine} heightClass={s.line} />
          </span>
        </>
      ) : (
        <span className="flex h-full w-full flex-col bg-white">
          <span
            className={cn(
              "flex items-center justify-between",
              s.pad,
              headerStyle === "band" ? s.band : "min-h-[30%]"
            )}
            style={
              headerStyle === "band"
                ? { backgroundColor: band, minHeight: size === "lg" ? "2.25rem" : "1.5rem" }
                : undefined
            }
          >
            <span className={cn("flex flex-1 flex-col", s.gap)}>
              <Line
                width="55%"
                color={headerStyle === "band" ? nameColor : heading}
                heightClass={s.name}
              />
              <Line
                width="35%"
                color={headerStyle === "band" ? withAlpha(nameColor, 0.7) : bodyLine}
                heightClass={s.line}
              />
            </span>
            {photo ? (
              <PhotoDot
                shape={photoShape}
                className={s.photo}
                fill={headerStyle === "band" && !lightBand ? "rgba(255,255,255,0.85)" : "#94a3b8"}
              />
            ) : null}
          </span>
          {headerStyle === "underline" ? (
            <span className="mx-2 h-px" style={{ backgroundColor: band }} />
          ) : null}
          <span className={cn("flex flex-1 flex-col", s.pad, s.gap)}>
            <SectionHeader
              band={band}
              headerStyle={headerStyle}
              bandClass={s.band}
              lineClass={s.line}
            />
            <Line width="100%" color={bodyLine} heightClass={s.line} />
            <Line width="92%" color={bodyLine} heightClass={s.line} />
            <Line width="78%" color={bodyLine} heightClass={s.line} />
            <SkillMarks style={skillsStyle} color={band} brickClass={s.brick} lineClass={s.line} />
            <SectionHeader
              band={band}
              headerStyle={headerStyle}
              bandClass={s.band}
              lineClass={s.line}
            />
            <Line width="100%" color={bodyLine} heightClass={s.line} />
            <Line width="70%" color={bodyLine} heightClass={s.line} />
          </span>
        </span>
      )}
    </span>
  );
}
