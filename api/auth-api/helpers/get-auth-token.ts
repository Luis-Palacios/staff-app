import type { AuthSession } from "@/api/auth-api/types";

import { getToken } from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { perRequest } from "@/api/auth-api/helpers/per-request";

// A minted JWT is reused across requests until shortly before it expires, instead of minting one
// per server action: each mint counts against auth-server's rate limit, and auto-save makes a
// server action per change.
//
// The key is the session plus what the token carries (user, role, permissions), so a token is
// only reused by requests that came with that same session, and a role change mints a new one on
// the next request. The session itself is still read on every request (getServerSession), so a
// signed-out or banned user is turned away before a kept token is used.
const REUSE_MARGIN_MS = 60_000;
const MAX_KEPT = 500;

interface KeptToken {
  token: string;
  expiresAt: number;
}

export interface RequestToken {
  token: string;
  /** Kept from an earlier request rather than minted for this one. */
  reused: boolean;
}

const kept = new Map<string, KeptToken>();

function keyFor({ session, user, permissions }: AuthSession): string {
  return JSON.stringify([session.id, user.id, user.role, permissions]);
}

// The `exp` claim in ms, or null when it can't be read (then the token isn't kept).
function expiryOf(token: string): number | null {
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    );
    const exp =
      payload && typeof payload === "object" && "exp" in payload
        ? payload.exp
        : null;

    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function keep(key: string, token: string): void {
  const expiresAt = expiryOf(token);

  if (expiresAt === null) return;

  // set() on an existing key keeps its old place in the Map's order: delete first, so a replaced
  // token moves to the newest end and an update doesn't evict anyone.
  kept.delete(key);

  if (kept.size >= MAX_KEPT) {
    const now = Date.now();

    for (const [k, t] of kept) {
      if (t.expiresAt - REUSE_MARGIN_MS <= now) kept.delete(k);
    }
    // Still full: drop the oldest (a Map iterates in insertion order).
    while (kept.size >= MAX_KEPT) {
      const oldest = kept.keys().next().value;

      if (oldest === undefined) break;
      kept.delete(oldest);
    }
  }

  kept.set(key, { token, expiresAt });
}

async function mint(
  cookie: string,
  session: AuthSession,
): Promise<RequestToken> {
  const { token } = await getToken(cookie);

  keep(keyFor(session), token);

  return { token, reused: false };
}

export const getAuthToken = perRequest(
  async (incoming): Promise<RequestToken | null> => {
    const cookie = incoming.get("cookie");
    const session = cookie ? await getServerSession() : null;

    if (!cookie || !session) {
      return null;
    }

    const reusable = kept.get(keyFor(session));

    if (reusable && reusable.expiresAt - REUSE_MARGIN_MS > Date.now()) {
      return { token: reusable.token, reused: true };
    }

    return mint(cookie, session);
  },
);

/**
 * Mints a token in place of a kept one the API rejected (its signing key rotated, say). Once per
 * request: a page whose parallel calls all got a 401 shares the one new token.
 */
export const replaceAuthToken = perRequest(
  async (incoming): Promise<RequestToken | null> => {
    const cookie = incoming.get("cookie");
    const session = cookie ? await getServerSession() : null;

    if (!cookie || !session) {
      return null;
    }

    kept.delete(keyFor(session));

    return mint(cookie, session);
  },
);
