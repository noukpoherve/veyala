import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const limitMock = vi.fn(async () => ({ success: true }));

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => ({}) },
}));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = vi.fn(() => ({}));
    limit = limitMock;
    constructor(_opts: unknown) {}
  }
  return { Ratelimit };
});

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: (name: string) => {
      if (name === "x-forwarded-for") return "203.0.113.10, 10.0.0.1";
      if (name === "x-real-ip") return "198.51.100.2";
      return null;
    },
  })),
}));

describe("memoryRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows calls under the limit and blocks beyond it", async () => {
    const { memoryRateLimit } = await import("@/lib/rate-limit");
    const key = `test-${Math.random()}`;
    expect(memoryRateLimit(key, 2, 1000)).toBe(true);
    expect(memoryRateLimit(key, 2, 1000)).toBe(true);
    expect(memoryRateLimit(key, 2, 1000)).toBe(false);
  });

  it("frees slots once the window slides", async () => {
    const { memoryRateLimit } = await import("@/lib/rate-limit");
    const key = `test-${Math.random()}`;
    memoryRateLimit(key, 1, 1000);
    expect(memoryRateLimit(key, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(memoryRateLimit(key, 1, 1000)).toBe(true);
  });

  it("tracks keys independently", async () => {
    const { memoryRateLimit } = await import("@/lib/rate-limit");
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
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `async-${Math.random()}`;
    expect(await rateLimit(key, 1, 1000)).toBe(true);
    expect(await rateLimit(key, 1, 1000)).toBe(false);
  });
});

describe("rateLimit (Upstash)", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    limitMock.mockReset();
    limitMock.mockResolvedValue({ success: true });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses Upstash when configured and caches the limiter", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `upstash-${Math.random()}`;
    expect(await rateLimit(key, 3, 1000)).toBe(true);
    limitMock.mockResolvedValueOnce({ success: false });
    expect(await rateLimit(key, 3, 1000)).toBe(false);
    expect(limitMock).toHaveBeenCalled();
  });

  it("falls back to memory when Upstash throws", async () => {
    limitMock.mockRejectedValue(new Error("redis down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `fallback-${Math.random()}`;
    expect(await rateLimit(key, 1, 1000)).toBe(true);
    expect(await rateLimit(key, 1, 1000)).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for hop", async () => {
    const { clientIp } = await import("@/lib/rate-limit");
    expect(clientIp()).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip then unknown", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockReturnValueOnce({
      get: (name: string) => (name === "x-real-ip" ? "198.51.100.2" : null),
    } as unknown as ReturnType<typeof headers>);
    const { clientIp } = await import("@/lib/rate-limit");
    expect(clientIp()).toBe("198.51.100.2");

    vi.mocked(headers).mockReturnValueOnce({
      get: () => null,
    } as unknown as ReturnType<typeof headers>);
    expect(clientIp()).toBe("unknown");
  });
});
