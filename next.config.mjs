/** @type {import('next').NextConfig} */

// No rewrites() for /api/auth: they're frozen at build time. proxy.ts forwards it at runtime.
const nextConfig = {};

export default nextConfig;
