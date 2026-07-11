export interface SwatchProps {
  layout: "sidebar-left" | "single-column";
  colors: string[];
  band: string;
}

/** Miniature layout preview built from a template definition's colors. */
export function TemplateSwatch({ layout, colors, band }: SwatchProps) {
  const gradient = colors.length > 1 ? `linear-gradient(180deg, ${colors.join(", ")})` : colors[0];
  return (
    <span aria-hidden className="flex h-16 w-full overflow-hidden rounded-md border">
      {layout === "sidebar-left" ? (
        <>
          <span className="h-full w-1/3" style={{ background: gradient }} />
          <span className="flex h-full flex-1 flex-col gap-1 bg-white p-1.5">
            <span className="h-1.5 w-2/3 rounded-sm" style={{ background: band }} />
            <span className="h-1 w-full rounded-sm bg-gray-200" />
            <span className="h-1 w-5/6 rounded-sm bg-gray-200" />
          </span>
        </>
      ) : (
        <span className="flex h-full flex-1 flex-col gap-1 bg-white p-1.5">
          <span className="h-1.5 w-1/2 rounded-sm" style={{ background: band }} />
          <span className="h-1 w-full rounded-sm bg-gray-200" />
          <span className="h-1 w-full rounded-sm bg-gray-200" />
          <span className="h-1 w-3/4 rounded-sm bg-gray-200" />
        </span>
      )}
    </span>
  );
}
