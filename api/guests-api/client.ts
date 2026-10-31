import type {
  PersonTimeline,
  TimelineParams,
} from "@/api/small-groups-api/types";
import type {
  GuestCreateInput,
  GuestDeactivateInput,
  GuestDetail,
  GuestList,
  GuestListParams,
  GuestSearchItem,
  GuestUpdateInput,
} from "@/api/guests-api/types";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { timelineQuery } from "@/api/small-groups-api/client";
import { getEnv } from "@/lib/env/server";

function guestPath(id: number | string): string {
  return `/guests/${encodeURIComponent(String(id))}`;
}

/** Every guest (`guests: view` + `all`), paged, with the tab counts. */
export function listGuests(params: GuestListParams = {}): Promise<GuestList> {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  const qs = query.toString();

  return authenticatedFetch<GuestList>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    qs ? `/guests?${qs}` : "/guests",
    { cache: "no-store" },
  );
}

/**
 * Church-wide search by name or phone (`guests: search`), at most 10. Empty for a query under 2
 * characters and for a caller who leads no open guest group.
 */
export function searchGuests(query: string): Promise<GuestSearchItem[]> {
  return authenticatedFetch<GuestSearchItem[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/guests/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );
}

/** 404 outside the caller's scope. */
export function getGuest(id: number | string): Promise<GuestDetail> {
  return authenticatedFetch<GuestDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    guestPath(id),
    { cache: "no-store" },
  );
}

/** Without `smallGroupId` it needs `guests: all`. 409 `guest groups are off` when the setting is off. */
export function createGuest(input: GuestCreateInput): Promise<GuestDetail> {
  return authenticatedFetch<GuestDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/guests",
    { method: "POST", body: input },
  );
}

/** Send only the fields that changed. */
export function updateGuest(
  id: number | string,
  changes: GuestUpdateInput,
): Promise<GuestDetail> {
  return authenticatedFetch<GuestDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    guestPath(id),
    { method: "PATCH", body: changes },
  );
}

/** `guests: deactivate`. Ends their group period today. 409 `already_inactive`; 422 for a future date. */
export function deactivateGuest(
  id: number | string,
  input: GuestDeactivateInput,
): Promise<GuestDetail> {
  return authenticatedFetch<GuestDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `${guestPath(id)}/deactivate`,
    { method: "POST", body: input },
  );
}

/** `guests: reactivate` and the guest in the caller's scope. Their group isn't restored. 409 `already_active`. */
export function reactivateGuest(
  id: number | string,
  note?: string | null,
): Promise<GuestDetail> {
  return authenticatedFetch<GuestDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `${guestPath(id)}/reactivate`,
    { method: "POST", body: { note: note ?? null } },
  );
}

/** Like `getMemberTimeline` for a guest (`guests: view` + guests scope; 404 outside it). */
export function getGuestTimeline(
  id: number | string,
  params: TimelineParams = {},
): Promise<PersonTimeline> {
  return authenticatedFetch<PersonTimeline>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `${guestPath(id)}/timeline${timelineQuery(params)}`,
    { cache: "no-store" },
  );
}
