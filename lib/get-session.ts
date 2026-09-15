import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env/server";

export type ServerSession = {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: string | null;
  };
};

// Confirmed via node_modules/better-auth/dist/api/routes/session.mjs: /get-session requires the
// request's cookie header (`requireHeaders: true`) and returns `{ session, user } | null`. Called
// server-to-server against auth-server directly (not through next.config.mjs's rewrite, which
// only exists for the browser's own same-origin requests) since this runs in a Server Component,
// not the browser.
export async function getServerSession(): Promise<ServerSession | null> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");

  if (!cookie) return null;

  const response = await fetch(
    `${env.AUTH_SERVER_INTERNAL_URL}/api/auth/get-session`,
    { headers: { cookie }, cache: "no-store" },
  );

  if (!response.ok) return null;

  return (await response.json()) as ServerSession | null;
}
