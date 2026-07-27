import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // "server-only" throws outside a React Server environment; stub it in tests.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Scoped to the pure modules under test; broaden as coverage grows.
      include: [
        "lib/templates/merge.ts",
        "lib/rate-limit.ts",
        "lib/cv-schema.ts",
        "lib/match-score.ts",
        "lib/job-requirements.ts",
        "lib/credits.ts",
        "lib/payments.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
