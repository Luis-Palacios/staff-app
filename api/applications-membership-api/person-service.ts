import type { PersonAssistanceSummary, PersonEventSummary } from "./types";

import { authenticatedFetch } from "../authenticated-fetch";

import { env } from "@/lib/env/server";

const BASE_URL = env.APPLICATIONS_MEMBERSHIP_API_URL;

export function getPersonEventsSummary(
  personId: number,
): Promise<PersonEventSummary[]> {
  return authenticatedFetch(BASE_URL, `/people/${personId}/events`);
}

export function getFirstPersonAssistanceSummary(
  personId: number,
): Promise<PersonAssistanceSummary> {
  return authenticatedFetch(BASE_URL, `/people/${personId}/first-assistance`);
}
