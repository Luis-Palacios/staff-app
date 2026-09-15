import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // No baseURL: with the /api/auth/* proxy in place (next.config.mjs), better-auth's own
  // relative-path default ("/api/auth") already resolves to this app's own origin, which the
  // rewrite then relays server-side to auth-server.
  //
  // Mirrors the `admin` plugin configured server-side (auth-server/src/lib/auth.ts) — this is
  // what types `session.user.role` correctly and gives access to the admin-only client methods
  // used later (Phase 6: listUsers/setRole).
  plugins: [adminClient()],
});
