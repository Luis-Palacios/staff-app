import type { AuthSession } from "@/api/auth-api/types";

import { headers } from "next/headers";

import { getSession } from "@/api/auth-api/client";

export async function getServerSession(): Promise<AuthSession | null> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");

  if (!cookie) {
    return null;
  }

  return getSession(cookie);
}
