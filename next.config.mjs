/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les assets du CV (dégradé, logo, photo) sont lus depuis /assets côté serveur.
  outputFileTracingIncludes: {
    "/api/generate": ["./assets/**"],
  },
};
export default nextConfig;
