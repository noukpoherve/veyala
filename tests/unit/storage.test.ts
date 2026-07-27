import { describe, expect, it, vi, afterEach } from "vitest";
import { keyFromStoredUrl } from "@/lib/storage";

describe("keyFromStoredUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("extracts keys from the /api/files proxy path", () => {
    expect(keyFromStoredUrl("/api/files/exports/u1/abc.pdf")).toBe("exports/u1/abc.pdf");
  });

  it("extracts keys from S3_PUBLIC_URL when configured", () => {
    vi.stubEnv("S3_PUBLIC_URL", "https://cdn.example.com");
    expect(keyFromStoredUrl("https://cdn.example.com/exports/u1/abc.pdf")).toBe(
      "exports/u1/abc.pdf"
    );
  });

  it("returns null for unknown or empty URLs", () => {
    expect(keyFromStoredUrl(null)).toBeNull();
    expect(keyFromStoredUrl("https://evil.example/file.pdf")).toBeNull();
  });
});
