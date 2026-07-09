/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Node-native libraries used by API routes must stay unbundled.
    serverComponentsExternalPackages: ["pdf-parse", "mammoth", "docx", "playwright-core"],
    // Editor saves can carry a base64 photo inside the CV JSON.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
