import type { AuthSession } from "@/api/auth-api/types";

import { apiFetch } from "@/lib/api-client";
import { env } from "@/lib/env/server";

const BASE_URL = env.NEXT_PUBLIC_AUTH_SERVER_URL;

// Server-to-server: calls auth-server directly, not through the /api/auth proxy (Phase 3) —
// that proxy exists so a *browser* fetch lands its Set-Cookie same-origin; this runs on the
// server and just forwards the cookie header it already received. Returns null for "no session"
// (auth-server answers 200 + null body, never 4xx, for that case — verified in
// better-auth/dist/api/routes/session.mjs) rather than throwing.
export function getSession(cookie: string): Promise<AuthSession | null> {
  return apiFetch<AuthSession | null>(BASE_URL, "/api/auth/get-session", {
    headers: { cookie },
    cache: "no-store",
  });
}
