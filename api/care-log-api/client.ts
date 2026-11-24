import type { ApiFetchOptions } from "@/api/api-client";
import type {
  CareLogAudience,
  CareLogAudienceInput,
  CareLogComingUp,
  CareLogCompleteInput,
  CareLogCreateInput,
  CareLogEntry,
  CareLogPersonOption,
  CareLogUpdateInput,
} from "@/api/care-log-api/types";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { getEnv } from "@/lib/env/server";

function request<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  return authenticatedFetch<TResponse>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    path,
    { cache: "no-store", ...options },
  );
}

/** `careLog: create`. `query` is 2–100 characters; up to 10 rows, in the caller's scope. */
export function searchCareLogPeople(
  query: string,
): Promise<CareLogPersonOption[]> {
  return request<CareLogPersonOption[]>(
    `/care-log/people-search?q=${encodeURIComponent(query)}`,
  );
}

/** 201. 409 `link` without a linked member. */
export function createCareLogEntry(
  input: CareLogCreateInput,
): Promise<CareLogEntry> {
  return request<CareLogEntry>("/care-log", { method: "POST", body: input });
}

export function getCareLogEntry(id: number): Promise<CareLogEntry> {
  return request<CareLogEntry>(`/care-log/${id}`);
}

/** The author only (403 `author`). Send only the fields that changed. */
export function updateCareLogEntry(
  id: number,
  changes: CareLogUpdateInput,
): Promise<CareLogEntry> {
  return request<CareLogEntry>(`/care-log/${id}`, {
    method: "PATCH",
    body: changes,
  });
}

/** 204; the author only. */
export function deleteCareLogEntry(id: number): Promise<void> {
  return request<void>(`/care-log/${id}`, { method: "DELETE" });
}

/** *Record how it went*: a planned entry becomes done. 409 `not_planned` otherwise. */
export function completeCareLogEntry(
  id: number,
  input: CareLogCompleteInput,
): Promise<CareLogEntry> {
  return request<CareLogEntry>(`/care-log/${id}/complete`, {
    method: "POST",
    body: input,
  });
}

/** *It didn't happen*: the entry stays, cancelled. `reason` is up to 500 characters. */
export function cancelCareLogEntry(
  id: number,
  reason?: string,
): Promise<CareLogEntry> {
  return request<CareLogEntry>(`/care-log/${id}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

/** Who among `participants` would see this entry (`careLog: create`); nothing is saved. */
export function checkCareLogAudience(
  input: CareLogAudienceInput,
): Promise<CareLogAudience> {
  return request<CareLogAudience>("/care-log/audience", {
    method: "POST",
    body: input,
  });
}

/** The caller's own plans: past due, and the next 7 days (`careLog: view`). */
export function getCareLogComingUp(): Promise<CareLogComingUp> {
  return request<CareLogComingUp>("/care-log/coming-up");
}
