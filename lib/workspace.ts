import "server-only";

import type { ChurchContext } from "@/config/site";

import { cache } from "react";
import { cookies } from "next/headers";

import { siteConfig } from "@/config/site";

/** Cookie holding the church id the user last switched to. A preference, not a
 *  credential: it only picks among `churches`, never grants access. */
export const CHURCH_COOKIE = "ekk_church";

/**
 * The ministry and church this request works in. The only place that reads
 * `siteConfig.ministry` / `siteConfig.churches`: everything else goes through
 * here, so moving the source to the session / auth-server changes nothing for
 * callers (that's why it's async already).
 *
 * The current church comes from the `ekk_church` cookie, but only when that id
 * is in `churches`; a missing, stale or tampered cookie falls back to the first
 * church. When churches come from the auth-server, `churches` will already be
 * the list this user may see, so the cookie can never widen access.
 *
 * `cache()` shares one call per request between the layout and any page.
 */
export const getChurchContext = cache(async (): Promise<ChurchContext> => {
  const { ministry, churches } = siteConfig;
  const selectedId = (await cookies()).get(CHURCH_COOKIE)?.value;
  const church =
    churches.find((candidate) => candidate.id === selectedId) ?? churches[0];

  return { ministry, church, churches };
});
