import { describe, expect, it } from "vitest";
import { inlineLinksToHtml, normalizeHttpUrl, parseInlineLinks } from "@/lib/inline-links";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

describe("inline-links", () => {
  it("normalizes bare domains to https", () => {
    expect(normalizeHttpUrl("example.com")).toBe("https://example.com");
    expect(normalizeHttpUrl("https://example.com")).toBe("https://example.com");
  });

  it("parses markdown-style links inside plain text", () => {
    expect(parseInlineLinks("Built [MyExt](https://m.example/x) for VS Code")).toEqual([
      { type: "text", value: "Built " },
      { type: "link", label: "MyExt", url: "https://m.example/x" },
      { type: "text", value: " for VS Code" },
    ]);
  });

  it("renders safe HTML anchors", () => {
    const html = inlineLinksToHtml('See [pkg](evil.com/"onclick")', esc);
    expect(html).toContain('<a href="https://evil.com/&quot;onclick&quot;">pkg</a>');
    expect(html).not.toContain("<script");
  });
});
