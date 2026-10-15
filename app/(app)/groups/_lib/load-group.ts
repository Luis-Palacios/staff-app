import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getSmallGroup } from "@/api/small-groups-api/client";

/**
 * The group for a detail or edit page. An unknown id shows the 404 page; any
 * other error goes to `app/(app)/error.tsx`. `cache()` lets the page and its
 * callers share one request.
 *
 * An id that isn't a positive integer can't exist, so it's a 404 without
 * calling the API (which would answer 422).
 */
export const loadGroup = cache(async (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();

  try {
    return await getSmallGroup(id);
  } catch (error) {
    // 422: the API couldn't read the id, so there is no such group.
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }

    throw error;
  }
});
