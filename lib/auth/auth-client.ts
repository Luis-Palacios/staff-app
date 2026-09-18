import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { createAccessControl } from "better-auth/plugins/access";
import { inviteClient } from "better-invite";

import { AUTH_ROLES } from "./roles";

// Not the actual statements/grants, which this client never evaluates itself (no
// hasPermission/checkRolePermission calls here) — just enough for adminClient() to type
// admin.setRole({ role }) against the full AuthRole union instead of defaulting to "admin" | "user".
const accessControl = createAccessControl({});
const roles = Object.fromEntries(
  AUTH_ROLES.map((role) => [role, accessControl.newRole({})]),
) as Record<
  (typeof AUTH_ROLES)[number],
  ReturnType<typeof accessControl.newRole>
>;

export const authClient = createAuthClient({
  // No baseURL: with the /api/auth/* proxy in place (next.config.mjs), better-auth's own
  // relative-path default ("/api/auth") already resolves to this app's own origin, which the
  // rewrite then relays server-side to auth-server.
  //
  // Mirrors the `admin` plugin configured server-side (auth-server/src/lib/auth.ts) — this is
  // what types `session.user.role` correctly and gives access to the admin-only client methods
  // used later (Phase 6: listUsers/setRole).
  plugins: [adminClient({ roles }), inviteClient()],
});
