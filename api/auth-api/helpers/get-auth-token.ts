import { headers } from "next/headers";

import { getToken } from "@/api/auth-api/client";

export async function getAuthToken(): Promise<string | null> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");

  if (!cookie) {
    return null;
  }

  const { token } = await getToken(cookie);

  return token;
}
