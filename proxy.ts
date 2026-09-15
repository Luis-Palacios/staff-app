import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Named `proxy.ts`, not `middleware.ts` — Next.js 16 deprecated the latter in favor of this file
// convention (same request-interception mechanics, still runs ahead of routing on every matched
// request; unlike the old "middleware" name, "proxy" always runs on the Node.js runtime, not Edge
// — see https://nextjs.org/docs/messages/middleware-to-proxy).
//
// Presence-only check: confirms a session cookie exists, no network call. It does NOT validate
// the cookie or read `role`; a stale/forged cookie still passes this gate. That's deliberate: the
// actual validated session (via the proxied /api/auth/get-session) is fetched server-side in a
// Server Component layout, which is also where role-based access (nav gating, etc.) belongs.
// This proxy's only job is redirecting the obviously-unauthenticated away from protected routes.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except: the proxied auth API, Next internals/static assets, and the sign-in page
  // itself (which must stay reachable to unauthenticated users).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|sign-in).*)"],
};
