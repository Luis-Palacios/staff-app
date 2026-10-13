import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getMember } from "@/api/members-api/client";

/**
 * The member for a detail or edit page. An unknown id shows the 404 page;
 * any other error goes to `app/(app)/error.tsx`. `cache()` lets the page and
 * `generateMetadata`-style callers share one request.
 *
 * An id that isn't a positive integer can't exist, so it's a 404 without
 * calling the API (which would answer 422).
 */
export const loadMember = cache(async (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();

  try {
    return await getMember(id);
  } catch (error) {
    // 422: the API couldn't read the id, so there is no such member.
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }

    throw error;
  }
});
