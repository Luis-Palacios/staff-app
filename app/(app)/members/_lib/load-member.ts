import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getMember } from "@/api/members-api/client";

/**
 * The member for a detail or edit page. An unknown id shows the 404 page;
 * any other error goes to `app/(app)/error.tsx`. `cache()` lets the page and
 * `generateMetadata`-style callers share one request.
 */
export const loadMember = cache(async (id: string) => {
  try {
    return await getMember(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  }
});
