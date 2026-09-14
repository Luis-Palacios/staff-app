import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Must be a literal `process.env.NEXT_PUBLIC_...` expression (not routed through lib/env.ts's
// requireEnv) so Next.js can statically inline it into the browser bundle — this file runs
// client-side. See the comment on NEXT_PUBLIC_AUTH_SERVER_URL in .env.example.
const baseURL = process.env.NEXT_PUBLIC_AUTH_SERVER_URL;

if (!baseURL) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_AUTH_SERVER_URL. Set it in .env.local for local dev, or in the deployment environment.",
  );
}

export const authClient = createAuthClient({
  baseURL,
  // Mirrors the `admin` plugin configured server-side (auth-server/src/lib/auth.ts) — this is
  // what types `session.user.role` correctly and gives access to the admin-only client methods
  // used later (Phase 6: listUsers/setRole).
  plugins: [adminClient()],
});
