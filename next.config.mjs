/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
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

export default nextConfig;
