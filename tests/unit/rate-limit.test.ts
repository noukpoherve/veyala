import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoryRateLimit, rateLimit } from "@/lib/rate-limit";

describe("memoryRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows calls under the limit and blocks beyond it", () => {
    const key = `test-${Math.random()}`;
    expect(memoryRateLimit(key, 2, 1000)).toBe(true);
    expect(memoryRateLimit(key, 2, 1000)).toBe(true);
    expect(memoryRateLimit(key, 2, 1000)).toBe(false);
  });

  it("frees slots once the window slides", () => {
    const key = `test-${Math.random()}`;
    memoryRateLimit(key, 1, 1000);
    expect(memoryRateLimit(key, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(memoryRateLimit(key, 1, 1000)).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(memoryRateLimit(a, 1, 1000)).toBe(true);
    expect(memoryRateLimit(b, 1, 1000)).toBe(true);
    expect(memoryRateLimit(a, 1, 1000)).toBe(false);
  });
});

describe("rateLimit (memory fallback)", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("falls back to memory when Upstash is not configured", async () => {
    const key = `async-${Math.random()}`;
    expect(await rateLimit(key, 1, 1000)).toBe(true);
    expect(await rateLimit(key, 1, 1000)).toBe(false);
  });
});
