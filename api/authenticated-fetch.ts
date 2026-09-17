import type { ApiFetchOptions } from "@/api/api-client";

import { apiFetch } from "@/api/api-client";
import { getAuthToken } from "@/api/auth-api/helpers/get-auth-token";

// Wraps apiFetch for calls that need the JWT bridge (Phase 4) - mints a fresh token per call
// (no caching yet, see docs/AUTH-INTEGRATION-ROADMAP.md) and attaches it as a Bearer header.
// Any headers passed in `options` are spread last, so a caller can still override it if it ever
// needs to - same override-friendly composition apiFetch itself already uses for Accept/Content-Type.
export async function authenticatedFetch<TResponse>(
  baseUrl: string,
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  const token = await getAuthToken();

  return apiFetch<TResponse>(baseUrl, path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
