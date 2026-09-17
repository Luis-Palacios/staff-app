import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { createAccessControl } from "better-auth/plugins/access";

// Role *names* only, mirroring auth-server/src/permissions/statements.ts's role set — not the
// actual statements/grants, which this client never evaluates itself (no hasPermission/
// checkRolePermission calls here). Without this, adminClient() defaults its role typing to just
// "admin" | "user", so e.g. admin.setRole({ role: "elder" }) wouldn't type-check. Same
// hand-maintained-duplication tradeoff already documented on AuthRole in api/auth-api/types.ts.
const accessControl = createAccessControl({});
const roles = {
  admin: accessControl.newRole({}),
  user: accessControl.newRole({}),
  smallGroupLeader: accessControl.newRole({}),
  deacon: accessControl.newRole({}),
  pending: accessControl.newRole({}),
  elder: accessControl.newRole({}),
};

export const authClient = createAuthClient({
  // No baseURL: with the /api/auth/* proxy in place (next.config.mjs), better-auth's own
  // relative-path default ("/api/auth") already resolves to this app's own origin, which the
  // rewrite then relays server-side to auth-server.
  //
  // Mirrors the `admin` plugin configured server-side (auth-server/src/lib/auth.ts) — this is
  // what types `session.user.role` correctly and gives access to the admin-only client methods
  // used later (Phase 6: listUsers/setRole).
  plugins: [adminClient({ roles })],
});
