import type { ApiFetchOptions } from "@/api/api-client";
import type {
  CareLogAudience,
  CareLogAudienceInput,
  CareLogComingUp,
  CareLogCompleteInput,
  CareLogCreateInput,
  CareLogEntry,
  CareLogListParams,
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

/**
 * Entries in a date range, ordered by date, time (all-day first) and id (`careLog: view`). 422
 * `range` past 62 days; 404 for a group the caller can't reach. Cancelled entries are never sent.
 */
export function listCareLogEntries(
  params: CareLogListParams,
): Promise<CareLogEntry[]> {
  const query = new URLSearchParams({ from: params.from, to: params.to });

  if (params.mine) query.set("mine", "true");
  if (params.groupId !== undefined) {
    query.set("groupId", String(params.groupId));
  }

  for (const kind of params.kind ?? []) query.append("kind", kind);

  return request<CareLogEntry[]>(`/care-log?${query.toString()}`);
}

/** Who gains the entry by being named among `participants` (`careLog: create`); nothing is saved. */
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

/** *Add your note* (`careLog: create`): 201 with the whole entry. 409 `note_exists`, 403 `not_participant`. */
export function createCareLogNote(
  id: number,
  text: string,
): Promise<CareLogEntry> {
  return request<CareLogEntry>(`/care-log/${id}/notes`, {
    method: "POST",
    body: { text },
  });
}

/** The writer only (403 `not_note_writer`): 200 with the whole entry. */
export function updateCareLogNote(
  id: number,
  noteId: number,
  text: string,
): Promise<CareLogEntry> {
  return request<CareLogEntry>(`/care-log/${id}/notes/${noteId}`, {
    method: "PATCH",
    body: { text },
  });
}

/** 204; the writer only. */
export function deleteCareLogNote(id: number, noteId: number): Promise<void> {
  return request<void>(`/care-log/${id}/notes/${noteId}`, {
    method: "DELETE",
  });
}
