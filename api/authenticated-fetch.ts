import type { ApiFetchOptions } from "@/api/api-client";

import { ApiError, apiFetch } from "@/api/api-client";
import {
  getAuthToken,
  replaceAuthToken,
} from "@/api/auth-api/helpers/get-auth-token";
import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";

// Wraps apiFetch for calls that need the JWT bridge (Phase 4) - attaches a token as a Bearer header,
// reused across requests until it nears expiry (see getAuthToken).
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

  const send = (token: string | undefined) =>
    apiFetch<TResponse>(baseUrl, path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

  const current = await getAuthToken();

  try {
    return await send(current?.token);
  } catch (error) {
    // A kept token the API no longer accepts (signing key rotated, say): mint a fresh one and send
    // once more. The API checks the token before doing anything, so the retry can't apply a change
    // twice. A token minted for this request isn't retried: a new one wouldn't fare better.
    if (
      !current?.reused ||
      !(error instanceof ApiError) ||
      error.status !== 401
    ) {
      throw error;
    }
  }

  return send((await replaceAuthToken())?.token);
}
