// Can't import lib/env/server.ts here (confirmed empirically): next.config.mjs is loaded via
// native Node ESM before Next's TypeScript/webpack pipeline exists, so a .ts import fails with
// ERR_MODULE_NOT_FOUND — this isn't a path-alias problem, TypeScript just isn't compiled yet at
// this point in the load. process.env is the only option in this specific file.
const authServerInternalUrl = process.env.AUTH_SERVER_INTERNAL_URL;

if (!authServerInternalUrl) {
  throw new Error("Missing required env var: AUTH_SERVER_INTERNAL_URL");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        // Server-only — where Next.js's own server reaches auth-server.
        // See docs/AUTH-INTEGRATION-ROADMAP.md Phase 3.
        destination: `${authServerInternalUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
