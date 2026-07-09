/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Node-native libraries used by API routes must stay unbundled.
    serverComponentsExternalPackages: ["pdf-parse", "mammoth", "docx", "playwright-core"],
  },
};

export default nextConfig;
