import type { AuthSession } from "@/api/auth-api/types";

import { getSession } from "@/api/auth-api/client";
import { perRequest } from "@/api/auth-api/helpers/per-request";

// One auth-server round trip per request: the (app) layout, its pages, every authenticatedFetch
// call and, in a server action, forbiddenUnless and authenticatedFetch all share it (see
// perRequest for why this isn't cache()).
export const getServerSession = perRequest(
  async (incoming): Promise<AuthSession | null> => {
    const cookie = incoming.get("cookie");

    if (!cookie) {
      return null;
    }

    return getSession(cookie);
  },
);
