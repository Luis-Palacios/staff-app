import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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
// the token could ever be consumed.
const ALWAYS_ALLOWED_PATHS = new Set(["/accept-invite", "/reset-password"]);

export function proxy(request: NextRequest) {
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
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path+",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
