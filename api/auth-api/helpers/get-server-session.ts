import type { AuthSession } from "@/api/auth-api/types";

import { headers } from "next/headers";
import { cache } from "react";

import { getSession } from "@/api/auth-api/client";

// cache()d per request: the (app) layout, its pages and every authenticatedFetch call read the
// session, and should share one auth-server round trip.
export const getServerSession = cache(async (): Promise<AuthSession | null> => {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");

  if (!cookie) {
    return null;
  }

  return getSession(cookie);
});
