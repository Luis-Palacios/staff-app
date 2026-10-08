import type { PersonAssistanceSummary, PersonEventSummary } from "./types";

import { authenticatedFetch } from "../authenticated-fetch";

import { getEnv } from "@/lib/env/server";

export function getPersonEventsSummary(
  personId: number,
): Promise<PersonEventSummary[]> {
  return authenticatedFetch(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/people/${personId}/events`,
  );
}

export function getFirstPersonAssistanceSummary(
  personId: number,
): Promise<PersonAssistanceSummary> {
  return authenticatedFetch(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/people/${personId}/first-assistance`,
  );
}
