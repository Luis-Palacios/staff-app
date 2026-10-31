import type {
  AdminListInvitesResponse,
  AdminUserListItem,
  AdminListUsersResponse,
  AuthRole,
  AuthSession,
  AuthToken,
} from "@/api/auth-api/types";

import { headers } from "next/headers";

import { apiFetch } from "@/api/api-client";
import { getEnv } from "@/lib/env/server";

// auth-server rate limits per client IP, read from X-Forwarded-For. Without this header every call
// from this server lands in one bucket shared by all users, so one browser can get everyone 429s.
// Always the whole header, never its leftmost entry: the client can write anything there, and only
// the entry the ALB appends on the right can be believed. auth-server walks it from the right.
function clientIpHeader(forwardedFor: string | null): Record<string, string> {
  return forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
}

async function incomingClientIpHeader(): Promise<Record<string, string>> {
  return clientIpHeader((await headers()).get("x-forwarded-for"));
}

// Server-to-server: calls auth-server directly, not through the /api/auth proxy (Phase 3) —
// that proxy exists so a *browser* fetch lands its Set-Cookie same-origin; this runs on the
// server and just forwards the cookie header it already received. Returns null for "no session"
// (auth-server answers 200 + null body, never 4xx, for that case — verified in
// better-auth/dist/api/routes/session.mjs) rather than throwing.
//
// `permissions` is what the role can do (auth-server's customSession); a response without it gets
// none, so a missing field fails closed (rule 10).
//
// proxy.ts passes `forwardedFor`, since next/headers isn't available there. Everyone else leaves it
// out and the incoming request's header is used.
export async function getSession(
  cookie: string,
  forwardedFor?: string | null,
): Promise<AuthSession | null> {
  const session = await apiFetch<
    (Omit<AuthSession, "permissions"> & Partial<AuthSession>) | null
  >(getEnv().AUTH_SERVER_URL, "/api/auth/get-session", {
    headers: {
      cookie,
      ...(forwardedFor === undefined
        ? await incomingClientIpHeader()
        : clientIpHeader(forwardedFor)),
    },
    cache: "no-store",
  });

  return session && { ...session, permissions: session.permissions ?? {} };
}

// Mints a short-lived JWT (`role` and `perms` claims, see auth-server's jwt.definePayload) from the
// incoming session cookie - server-to-server, same reasoning as getSession above: this runs on
// the server and forwards the cookie header it already has, no browser call involved.
export async function getToken(cookie: string): Promise<AuthToken> {
  return apiFetch<AuthToken>(getEnv().AUTH_SERVER_URL, "/api/auth/token", {
    headers: { cookie, ...(await incomingClientIpHeader()) },
    cache: "no-store",
  });
}

// Session-cookie-gated (admin plugin's adminMiddleware), same reasoning as getSession/getToken
// above — not JWT-based, so this doesn't go through lib/authenticated-fetch.ts. No query params:
// an absent limit/offset means "no limit clause" server-side (verified in better-auth's
// admin/routes.mjs), not a hidden default page size — a hand-picked cap here would be a
// regression, not a safety net.
export async function listUsers(
  cookie: string,
): Promise<AdminListUsersResponse> {
  return apiFetch<AdminListUsersResponse>(
    getEnv().AUTH_SERVER_URL,
    "/api/auth/admin/list-users",
    {
      headers: { cookie, ...(await incomingClientIpHeader()) },
      cache: "no-store",
    },
  );
}

// Not one of better-auth's own endpoints - this hits auth-server's custom /api/custom-auth/invites
// route (see its own file for why: better-invite's own GET /invite/list hard-scopes results to
// `createdByUserId === the caller`, so an admin and an elder would each only ever see invites
// they personally sent). Same session-cookie-gated, server-to-server pattern as listUsers above -
// the route verifies the forwarded cookie itself, this call doesn't grant anything by itself.
// No client IP: this route isn't behind better-auth's rate limiter.
export function listInvites(cookie: string): Promise<AdminListInvitesResponse> {
  return apiFetch<AdminListInvitesResponse>(
    getEnv().AUTH_SERVER_URL,
    "/api/custom-auth/invites",
    {
      headers: { cookie },
      cache: "no-store",
    },
  );
}

// Session-cookie-gated like listUsers. `admin/get-user` is better-auth's own endpoint, id in the
// query string; it answers with the bare user object.
export async function getUser(
  cookie: string,
  id: string,
): Promise<AdminUserListItem> {
  return apiFetch<AdminUserListItem>(
    getEnv().AUTH_SERVER_URL,
    `/api/auth/admin/get-user?id=${encodeURIComponent(id)}`,
    {
      headers: { cookie, ...(await incomingClientIpHeader()) },
      cache: "no-store",
    },
  );
}

// better-invite's POST /invite/create and /invite/cancel are session-gated and permission-checked
// (admin/elder) by auth-server itself. Called from a server action, so the incoming cookie is
// forwarded, plus the browser's own Origin: better-auth rejects a cookie-bearing POST without one.
// accept-language is forwarded because the invite email is localized from it.
export interface ForwardedRequest {
  cookie: string;
  origin: string;
  acceptLanguage: string | null;
}

async function forwardedHeaders(
  request: ForwardedRequest,
): Promise<Record<string, string>> {
  return {
    cookie: request.cookie,
    origin: request.origin,
    ...(request.acceptLanguage && {
      "accept-language": request.acceptLanguage,
    }),
    ...(await incomingClientIpHeader()),
  };
}

export async function createInvite(
  request: ForwardedRequest,
  input: { email: string; role: AuthRole },
): Promise<unknown> {
  return apiFetch<unknown>(
    getEnv().AUTH_SERVER_URL,
    "/api/auth/invite/create",
    {
      method: "POST",
      headers: await forwardedHeaders(request),
      body: {
        ...input,
        redirectToAfterUpgrade: `${request.origin}/`,
      },
      cache: "no-store",
    },
  );
}

export async function cancelInvite(
  request: ForwardedRequest,
  token: string,
): Promise<unknown> {
  return apiFetch<unknown>(
    getEnv().AUTH_SERVER_URL,
    "/api/auth/invite/cancel",
    {
      method: "POST",
      headers: await forwardedHeaders(request),
      body: { token },
      cache: "no-store",
    },
  );
}
