import { describe, expect, it } from "vitest";
import { hexLuminance } from "@/lib/color";
import { swatchFromDefinition } from "@/components/templates/template-swatch";
import { OFFICIAL_TEMPLATES } from "@/lib/templates/official";

describe("hexLuminance", () => {
  it("treats navy as dark and paper as light", () => {
    expect(hexLuminance("#16324f")).toBeLessThan(0.6);
    expect(hexLuminance("#f4f6f9")).toBeGreaterThan(0.6);
    expect(hexLuminance("#ffffff")).toBeGreaterThan(0.9);
    expect(hexLuminance("ffffff")).toBeGreaterThan(0.9);
  });
});

describe("swatchFromDefinition", () => {
  it("keeps layout, photo, and header cues that distinguish official templates", () => {
    const bySlug = Object.fromEntries(
      OFFICIAL_TEMPLATES.map((t) => [t.slug, swatchFromDefinition(t.definition)])
    );

    expect(bySlug["signature-degrade"]?.layout).toBe("sidebar-left");
    expect(bySlug["signature-degrade"]?.photoShape).toBe("circle");
    expect(bySlug["signature-degrade"]?.headerStyle).toBe("band");
    expect(bySlug["signature-degrade"]?.namePlacement).toBe("main");
    expect(bySlug["signature-degrade"]?.skillsStyle).toBe("bricks");

    expect(bySlug["cadre-bleu"]?.photoShape).toBe("square");
    expect(bySlug["cadre-bleu"]?.headerStyle).toBe("underline");
    expect(bySlug["cadre-bleu"]?.namePlacement).toBe("sidebar");
    expect(hexLuminance(bySlug["cadre-bleu"]?.colors[0] ?? "")).toBeGreaterThan(0.6);

    expect(bySlug["clarte-classique"]?.layout).toBe("single-column");
    expect(bySlug["clarte-classique"]?.headerStyle).toBe("band");

    expect(bySlug["horizon-bleu-nuit"]?.layout).toBe("sidebar-left");
    expect(bySlug["horizon-bleu-nuit"]?.skillsStyle).toBe("list");
    expect(bySlug["horizon-bleu-nuit"]?.colors).toEqual(["#16324f"]);
  });
});
