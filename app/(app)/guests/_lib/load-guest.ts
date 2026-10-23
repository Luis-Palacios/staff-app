import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getGuest } from "@/api/guests-api/client";

/**
 * The guest for a detail or edit page. Unknown, out of the caller's scope (the API answers 404 for
 * both) and a malformed id show the 404 page; any other error goes to `app/(app)/error.tsx`.
 */
export const loadGuest = cache(async (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();

  try {
    return await getGuest(id);
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
