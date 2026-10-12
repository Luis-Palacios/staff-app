import createNextIntlPlugin from "next-intl/plugin";

// Finds i18n/request.ts (next-intl's per-request locale + messages) by its
// default path.
const withNextIntl = createNextIntlPlugin({
  experimental: {
    // Generates messages/en.d.json.ts so t("key") without its ICU arguments fails tsc.
    createMessagesDeclaration: "./messages/en.json",
    // Compiles ICU messages at build time, so the message parser stays out of the client bundle.
    messages: {
      format: "json",
      path: "./messages",
      locales: ["en", "es"],
      precompile: true,
    },
  },
});

// No rewrites() for /api/auth: they're frozen at build time. proxy.ts forwards it at runtime.
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit .next/standalone: a minimal server.js plus only the node_modules files the server
  // actually loads, for a small container image. public/ and .next/static are NOT included;
  // the Dockerfile must copy them, or pages render without JS/CSS while /api/health stays 200.
  output: "standalone",
  // Shown in the sidebar footer. pnpm sets npm_package_version when it runs a
  // package.json script (dev/build), so this is the version at build time.
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "",
  },
};

export default withNextIntl(nextConfig);
