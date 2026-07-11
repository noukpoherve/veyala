import { describe, expect, it } from "vitest";
import { mergeTemplateLists } from "@/lib/templates/merge";
import type { Template } from "@prisma/client";

const template = (id: string, createdAt: string): Template =>
  ({
    id,
    createdAt: new Date(createdAt),
  }) as Template;

describe("mergeTemplateLists", () => {
  it("merges public and own templates ordered by creation date", () => {
    const merged = mergeTemplateLists(
      [template("pub-old", "2026-01-01"), template("pub-new", "2026-03-01")],
      [template("own", "2026-02-01")]
    );
    expect(merged.map((t) => t.id)).toEqual(["pub-old", "own", "pub-new"]);
  });

  it("deduplicates a template present in both lists, keeping the own copy", () => {
    const ownCopy = template("shared", "2026-01-15");
    const merged = mergeTemplateLists([template("shared", "2026-01-15")], [ownCopy]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toBe(ownCopy);
  });

  it("handles empty inputs", () => {
    expect(mergeTemplateLists([], [])).toEqual([]);
    expect(mergeTemplateLists([template("a", "2026-01-01")], []).map((t) => t.id)).toEqual(["a"]);
    expect(mergeTemplateLists([], [template("b", "2026-01-01")]).map((t) => t.id)).toEqual(["b"]);
  });

  it("tolerates string dates coming from the serialized Next.js data cache", () => {
    const cached = { id: "cached", createdAt: "2026-01-01T00:00:00.000Z" } as unknown as Template;
    const merged = mergeTemplateLists([cached], [template("own", "2026-02-01")]);
    expect(merged.map((t) => t.id)).toEqual(["cached", "own"]);
  });
});
