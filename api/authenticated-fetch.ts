import type { ApiFetchOptions } from "@/api/api-client";

import { apiFetch } from "@/api/api-client";
import { getAuthToken } from "@/api/auth-api/helpers/get-auth-token";
import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";

// Wraps apiFetch for calls that need the JWT bridge (Phase 4) - attaches a token as a Bearer header,
// minted once per page render and once per call in a server action (see getAuthToken).
// Any headers passed in `options` are spread last, so a caller can still override it if it ever
// needs to - same override-friendly composition apiFetch itself already uses for Accept/Content-Type.
// A user without access (no session, unverified email, pending role) is redirected before any
// request is made; see requireStaffSession for why the (app) layout's redirect isn't enough.
export async function authenticatedFetch<TResponse>(
  baseUrl: string,
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  await requireStaffSession();

  const token = await getAuthToken();

  return apiFetch<TResponse>(baseUrl, path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
