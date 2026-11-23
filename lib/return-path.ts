// Where to go after signing in: the page a signed-out visitor asked for, e.g. an email's link to
// `/groups/reports/812?person=1207`, carried as `/sign-in?next=…`. Pure, so the proxy, server
// code and the sign-in form share it.

/** The auth pages: never a return target (signing in to land on sign-in again). */
const AUTH_PAGES = new Set([
  "/sign-in",
  "/sign-up",
  "/needs-verification",
  "/needs-role",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invite",
]);

const BASE = "http://return.invalid";

/**
 * `value` as a same-origin path (path, query and hash), or null. Only a relative path that stays
 * on this origin passes: no `//host`, no backslashes (browsers read `/\host` as `//host`), no
 * control characters, nothing under `/api/` and no auth page.
 */
export function safeReturnPath(
  value: string | null | undefined,
): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value, BASE);
  } catch {
    return null;
  }

  if (
    url.origin !== BASE ||
    // Dot segments normalise `/..//evil.com` to `//evil.com`: a protocol-relative URL.
    url.pathname.startsWith("//") ||
    url.pathname.startsWith("/api/") ||
    AUTH_PAGES.has(url.pathname)
  ) {
    return null;
  }

  return url.pathname + url.search + url.hash;
}

/** `/sign-in`, with `?next=` when there is somewhere other than the dashboard to return to. */
export function signInHref(returnPath: string | null | undefined): string {
  const next = safeReturnPath(returnPath);

  return next && next !== "/"
    ? `/sign-in?next=${encodeURIComponent(next)}`
    : "/sign-in";
}

/** The request header the proxy sets with the page's path and query, for server redirects to
 *  sign-in (a layout doesn't know its URL). */
export const RETURN_PATH_HEADER = "x-ekk-return-path";
