import "server-only";

import { z } from "zod";

import { formatEnvError } from "@/lib/env/format-error";

// Bare origin only (e.g. http://auth-server:5000). proxy.ts builds targets with
// new URL(absolutePath, base), which drops any base path, while apiFetch's joinUrl keeps it -
// a path here would make browser (proxied) and server-side auth calls hit different URLs.
const bareOrigin = z.url({ protocol: /^https?$/ }).refine((value) => {
  const { pathname, search, hash } = new URL(value);

  return pathname === "/" && !search && !hash;
}, "must be a bare origin like http://host:port (no path, query or fragment)");

const schema = z.object({
  APPLICATIONS_MEMBERSHIP_API_URL: z.url(),
  AUTH_SERVER_URL: bareOrigin,
});

type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

// Validated on first call, not on import: `next build` imports every route module to read its
// segment config ("Collecting page data"), so validating on import made the build itself need
// runtime config. Call this inside request-time code only, never at module top level. A page
// prerendered at build time that calls it fails the build, which is what we want: config is
// never baked into the output.
export function getEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const parsed = schema.safeParse({
    APPLICATIONS_MEMBERSHIP_API_URL:
      process.env.APPLICATIONS_MEMBERSHIP_API_URL,
    AUTH_SERVER_URL: process.env.AUTH_SERVER_URL,
  });

  if (!parsed.success) {
    throw new Error(formatEnvError(parsed.error));
  }

  cached = parsed.data;

  return cached;
}
