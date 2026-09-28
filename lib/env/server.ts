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

const parsed = schema.safeParse({
  APPLICATIONS_MEMBERSHIP_API_URL: process.env.APPLICATIONS_MEMBERSHIP_API_URL,
  AUTH_SERVER_URL: process.env.AUTH_SERVER_URL,
});

if (!parsed.success) {
  throw new Error(formatEnvError(parsed.error));
}

export const env = parsed.data;
