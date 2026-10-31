import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { getSession } from "@/api/auth-api/client";
import { getEnv } from "@/lib/env/server";

// better-auth's endpoints, forwarded to auth-server. Done here rather than in next.config.mjs's
// rewrites() because those are evaluated once at `next build` and frozen into
// routes-manifest.json (verified), which would bake auth-server's address into the image.
// Middleware runs per request, so the destination is read from the env at runtime. Both paths
// end in the same Next.js proxyRequest(), so headers, cookies and streaming behave the same.
const AUTH_API_PREFIX = "/api/auth/";

const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/needs-verification",
  "/forgot-password",
]);
// Unlike PUBLIC_PATHS, this stays reachable regardless of session state - an already-logged-in
// user clicking an invite link still needs to hit this page (it immediately consumes the invite
// in that case), not get bounced to "/" before the activation call ever runs. /reset-password
// carries the same requirement for the same reason: the reset token lives in the query string,
// and PUBLIC_PATHS's redirect-away-if-authenticated behavior would drop that query string before
// the token could ever be consumed. /verify-email likewise: its token is in the query string, and
// the page itself handles an already-signed-in or already-verified visitor.
const ALWAYS_ALLOWED_PATHS = new Set([
  "/accept-invite",
  "/reset-password",
  "/verify-email",
]);

// better-auth's session cookies, with or without the __Secure- prefix it adds in production.
// session_data can be chunked (session_data.0, ...).
const SESSION_COOKIE =
  /^(__Secure-)?better-auth[.-](session_token|session_data|dont_remember)/;

// A cookie the browser still has can be stale: its session was deleted or the secret was rotated.
// Only auth-server can tell, so a public page asks it before sending the visitor to "/". Redirecting
// on the cookie alone is a loop: "/" finds no session and sends them back here. Any failure (a 429,
// auth-server down) shows the public page and keeps the cookie, since the session may still be good.
async function handleSessionCookieOnPublicPath(request: NextRequest) {
  let session;

  try {
    session = await getSession(request.headers.get("cookie") ?? "");
  } catch {
    return NextResponse.next();
  }

  if (session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();

  for (const { name } of request.cookies.getAll()) {
    if (SESSION_COOKIE.test(name)) {
      // Not cookies.delete(): a browser ignores a __Secure- cookie set without Secure.
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        secure: name.startsWith("__Secure-"),
      });
    }
  }

  return response;
}

export async function proxy(request: NextRequest) {
  // First, and unconditionally: auth-server authorizes its own endpoints, and several of them
  // (sign-in, sign-up, get-session, verify-email) must work with no session at all. The session
  // check below is a page-navigation redirect, not a security boundary.
  if (request.nextUrl.pathname.startsWith(AUTH_API_PREFIX)) {
    const { pathname, search } = request.nextUrl;

    return NextResponse.rewrite(
      new URL(pathname + search, getEnv().AUTH_SERVER_URL),
    );
  }

  if (ALWAYS_ALLOWED_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(getSessionCookie(request));
  const isPublicPath = PUBLIC_PATHS.has(request.nextUrl.pathname);

  if (!hasSessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (hasSessionCookie && isPublicPath) {
    return handleSessionCookieOnPublicPath(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path+",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
