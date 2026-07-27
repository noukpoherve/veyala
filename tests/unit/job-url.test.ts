import { describe, expect, it } from "vitest";
import { assertSafePublicUrl } from "@/lib/job-url";

describe("assertSafePublicUrl", () => {
  it("accepts a public https URL with a public IP host", async () => {
    const url = await assertSafePublicUrl("https://1.1.1.1/jobs/1");
    expect(url.hostname).toBe("1.1.1.1");
  });

  it("accepts example.com when DNS resolves", async () => {
    try {
      const url = await assertSafePublicUrl("https://example.com/jobs/1");
      expect(url.hostname).toBe("example.com");
    } catch (e) {
      // Offline / sandboxed CI without DNS: skip rather than flake.
      if (e instanceof Error && /résoudre/.test(e.message)) return;
      throw e;
    }
  });

  it("rejects non-http protocols", async () => {
    await expect(assertSafePublicUrl("file:///etc/passwd")).rejects.toThrow(/http/);
  });

  it("rejects localhost", async () => {
    await expect(assertSafePublicUrl("http://localhost:3000/secret")).rejects.toThrow();
  });

  it("rejects private IPv4 literals", async () => {
    await expect(assertSafePublicUrl("http://127.0.0.1/")).rejects.toThrow();
    await expect(assertSafePublicUrl("http://192.168.1.10/job")).rejects.toThrow();
    await expect(assertSafePublicUrl("http://10.0.0.5/")).rejects.toThrow();
  });

  it("rejects URLs with credentials", async () => {
    await expect(assertSafePublicUrl("https://user:pass@example.com/")).rejects.toThrow();
  });
});
