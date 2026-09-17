import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up", "/needs-verification"]);

export function proxy(request: NextRequest) {
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
