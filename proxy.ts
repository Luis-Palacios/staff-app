import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
