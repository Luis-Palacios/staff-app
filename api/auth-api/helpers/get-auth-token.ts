import { headers } from "next/headers";
import { cache } from "react";

import { getToken } from "@/api/auth-api/client";

// cache()d per request, like getServerSession: a page's API calls can share one JWT, and each mint
// counts against auth-server's rate limit. In a server action cache() doesn't apply, so each call
// mints its own.
export const getAuthToken = cache(async (): Promise<string | null> => {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");

  if (!cookie) {
    return null;
  }

  const { token } = await getToken(cookie);

  return token;
});
