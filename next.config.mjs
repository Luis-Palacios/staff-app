// No rewrites() for /api/auth: they're frozen at build time. proxy.ts forwards it at runtime.
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit .next/standalone: a minimal server.js plus only the node_modules files the server
  // actually loads, for a small container image. public/ and .next/static are NOT included;
  // the Dockerfile must copy them, or pages render without JS/CSS while /api/health stays 200.
  output: "standalone",
};

export default nextConfig;
