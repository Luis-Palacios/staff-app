import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getSmallGroupReport } from "@/api/small-groups-api/client";

/**
 * The report for a detail or edit page. An unknown id, or one outside the caller's scope, is a
 * 404 (access rule 4); any other error goes to `app/(app)/error.tsx`. An id that isn't a
 * positive integer can't exist, so it's a 404 without calling the API.
 */
export const loadReport = cache(async (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();

  try {
    return await getSmallGroupReport(id);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }

    throw error;
  }
});
