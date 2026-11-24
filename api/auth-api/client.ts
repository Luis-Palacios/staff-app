import type {
  AdminListInvitesResponse,
  AdminUserListItem,
  AdminListUsersResponse,
  AuthRole,
  AuthSession,
  AuthToken,
  PushConfig,
  PushSubscriptionInput,
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
// `accept-language` goes along (with the `ekk_locale` cookie inside `cookie`): when the call extends
// the session, auth-server fills the user's empty `locale` from them, which is the only way a user
// who never uses the language picker gets one (conversation emails, Part 2).
//
// proxy.ts passes `incoming`, since next/headers isn't available there. Everyone else leaves it out
// and the incoming request's headers are used.
export async function getSession(
  cookie: string,
  incoming?: { forwardedFor: string | null; acceptLanguage: string | null },
): Promise<AuthSession | null> {
  const acceptLanguage = incoming
    ? incoming.acceptLanguage
    : (await headers()).get("accept-language");
  const session = await apiFetch<
    (Omit<AuthSession, "permissions"> & Partial<AuthSession>) | null
  >(getEnv().AUTH_SERVER_URL, "/api/auth/get-session", {
    headers: {
      cookie,
      ...(incoming
        ? clientIpHeader(incoming.forwardedFor)
        : await incomingClientIpHeader()),
      ...(acceptLanguage && { "accept-language": acceptLanguage }),
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

/** The incoming request's cookie, Origin and accept-language, for a server action's POST. */
export async function incomingForwardedRequest(): Promise<ForwardedRequest> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  const protocol = incoming.get("x-forwarded-proto") ?? "http";

  return {
    cookie: incoming.get("cookie") ?? "",
    origin: incoming.get("origin") ?? `${protocol}://${host}`,
    acceptLanguage: incoming.get("accept-language"),
  };
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

// Web Push (notifications Part 2). Session-cookie-gated like the invite calls, called from server
// actions, so the incoming cookie and Origin are forwarded.

/** Whether push is on at the server and the VAPID public key to subscribe with. 401 without a
 *  session. */
export async function getPushConfig(
  request: ForwardedRequest,
): Promise<PushConfig> {
  return apiFetch<PushConfig>(getEnv().AUTH_SERVER_URL, "/api/push/config", {
    headers: await forwardedHeaders(request),
    cache: "no-store",
  });
}

/** Registers this browser's subscription for the caller (moves it when another user had it).
 *  404 `push_disabled`, 422 `invalid_request` / `invalid_endpoint`. */
export async function putPushSubscription(
  request: ForwardedRequest,
  subscription: PushSubscriptionInput,
): Promise<void> {
  await apiFetch<void>(getEnv().AUTH_SERVER_URL, "/api/push/subscriptions", {
    method: "PUT",
    headers: await forwardedHeaders(request),
    body: subscription,
    cache: "no-store",
  });
}

/** Deletes the caller's subscription for `endpoint`. Idempotent, works with push off. */
export async function deletePushSubscription(
  request: ForwardedRequest,
  endpoint: string,
): Promise<void> {
  await apiFetch<void>(getEnv().AUTH_SERVER_URL, "/api/push/subscriptions", {
    method: "DELETE",
    headers: await forwardedHeaders(request),
    body: { endpoint },
    cache: "no-store",
  });
}

// better-auth's POST /update-user for the signed-in user's own `locale` (auth-server's
// `user.additionalFields`, `en` | `es`; anything else is a 400). Overwrites it: the account menu's
// pick always wins over the value filled from the request.
export async function updateUserLocale(
  request: ForwardedRequest,
  locale: string,
): Promise<unknown> {
  return apiFetch<unknown>(getEnv().AUTH_SERVER_URL, "/api/auth/update-user", {
    method: "POST",
    headers: await forwardedHeaders(request),
    body: { locale },
    cache: "no-store",
  });
}
