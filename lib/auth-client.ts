import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// `baseURL` is deliberately left unset — NOT the same as "unspecified/don't care".
// it uses the default baseURL internally, which resolves to the same-origin "/api/auth" endpoint.
// handled /api/auth on the next.config.mjs rewrite rules.
export const authClient = createAuthClient({
  // Mirrors the `admin` plugin configured server-side (auth-server/src/lib/auth.ts) — this is
  // what types `session.user.role` correctly and gives access to the admin-only client methods
  // used later (Phase 6: listUsers/setRole).
  plugins: [adminClient()],
});
