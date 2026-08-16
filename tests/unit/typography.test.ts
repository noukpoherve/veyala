import { describe, expect, it } from "vitest";
import { stripEmDashes, stripEmDashesDeep } from "@/lib/typography";

describe("stripEmDashes", () => {
  it("turns date ranges into hyphens", () => {
    expect(stripEmDashes("2023 — 2025")).toBe("2023-2025");
    expect(stripEmDashes("2020–2022")).toBe("2020-2022");
  });

  it("replaces prose dashes with a comma", () => {
    expect(stripEmDashes("Un CV ciblé — pas un modèle générique.")).toBe(
      "Un CV ciblé, pas un modèle générique."
    );
  });

  it("leaves hyphenated words alone", () => {
    expect(stripEmDashes("full-stack et savoir-faire")).toBe("full-stack et savoir-faire");
  });
});

describe("stripEmDashesDeep", () => {
  it("walks nested generated CV fields", () => {
    expect(
      stripEmDashesDeep({
        headline: "Développeur — React",
        bullets: ["Piloté 4 campagnes — +38 % de leads"],
      })
    ).toEqual({
      headline: "Développeur, React",
      bullets: ["Piloté 4 campagnes, +38 % de leads"],
    });
  });
});
