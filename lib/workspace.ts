import "server-only";

import type { ChurchContext } from "@/config/site";

import { cache } from "react";

import { siteConfig } from "@/config/site";

/**
 * The ministry and church this request works in. The only place that reads
 * `siteConfig.ministry` / `siteConfig.churches`: everything else goes through
 * here, so moving the source to the session / auth-server changes nothing for
 * callers (that's why it's async already).
 *
 * `cache()` shares one call per request between the layout and any page.
 */
export const getChurchContext = cache(async (): Promise<ChurchContext> => {
  const { ministry, churches } = siteConfig;

  return { ministry, church: churches[0], churches };
});
