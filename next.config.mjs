import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required on Next.js 14 to load `instrumentation.ts`.
    instrumentationHook: true,
    // Node-native libraries used by API routes must stay unbundled.
    serverComponentsExternalPackages: [
      "pdf-parse",
      "mammoth",
      "docx",
      "playwright-core",
      "@sparticuz/chromium",
    ],
    // Editor saves can carry a base64 photo inside the CV JSON.
    serverActions: { bodySizeLimit: "4mb" },
    // @sparticuz/chromium's brotli-packed binary is only fs-read at runtime,
    // so file tracing misses it unless listed explicitly.
    outputFileTracingIncludes: {
      "/api/generate": ["./node_modules/@sparticuz/chromium/bin/**"],
      "/cv/**": ["./node_modules/@sparticuz/chromium/bin/**"],
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Proxy browser events through the app so ad-blockers don't drop them.
  tunnelRoute: "/monitoring",
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  webpack: {
    excludeServerRoutes: ["/api/health"],
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
