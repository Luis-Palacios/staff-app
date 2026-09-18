import type {
  AdminListInvitesResponse,
  AdminListUsersResponse,
  AuthSession,
  AuthToken,
} from "@/api/auth-api/types";

import { apiFetch } from "@/api/api-client";
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

// Mints a short-lived JWT (role claim only, see auth-server's jwt.definePayload) from the
// incoming session cookie - server-to-server, same reasoning as getSession above: this runs on
// the server and forwards the cookie header it already has, no browser call involved.
export function getToken(cookie: string): Promise<AuthToken> {
  return apiFetch<AuthToken>(BASE_URL, "/api/auth/token", {
    headers: { cookie },
    cache: "no-store",
  });
}

// Session-cookie-gated (admin plugin's adminMiddleware), same reasoning as getSession/getToken
// above — not JWT-based, so this doesn't go through lib/authenticated-fetch.ts. No query params:
// an absent limit/offset means "no limit clause" server-side (verified in better-auth's
// admin/routes.mjs), not a hidden default page size — a hand-picked cap here would be a
// regression, not a safety net.
export function listUsers(cookie: string): Promise<AdminListUsersResponse> {
  return apiFetch<AdminListUsersResponse>(
    BASE_URL,
    "/api/auth/admin/list-users",
    {
      headers: { cookie },
      cache: "no-store",
    },
  );
}

// Not one of better-auth's own endpoints - this hits auth-server's custom /api/custom-auth/invites
// route (see its own file for why: better-invite's own GET /invite/list hard-scopes results to
// `createdByUserId === the caller`, so an admin and an elder would each only ever see invites
// they personally sent). Same session-cookie-gated, server-to-server pattern as listUsers above -
// the route verifies the forwarded cookie itself, this call doesn't grant anything by itself.
export function listInvites(cookie: string): Promise<AdminListInvitesResponse> {
  return apiFetch<AdminListInvitesResponse>(
    BASE_URL,
    "/api/custom-auth/invites",
    {
      headers: { cookie },
      cache: "no-store",
    },
  );
}
