import "server-only";

import type { OtherGroup } from "@/api/small-groups-api/types";

import { ApiError } from "@/api/api-client";

/** The guest errors the UI tells apart (cross-repo spec, "Errors the staff app tells apart"). */
export type GuestErrorKind =
  | "off"
  | "inAnotherGroup"
  | "alreadyInGroup"
  | "closed"
  | "overlap"
  | "laterReport";

/** Matched on status and a phrase of `detail`, never shown. Null for any other error. */
export function getGuestErrorKind(error: unknown): GuestErrorKind | null {
  if (!(error instanceof ApiError)) return null;

  const detail = JSON.stringify(error.body ?? "").toLowerCase();

  if (error.status === 409) {
    if (detail.includes("guest groups are off")) return "off";
    if (detail.includes("in another group")) return "inAnotherGroup";
    if (detail.includes("already in the small group")) return "alreadyInGroup";
    if (detail.includes("overlaps an earlier period")) return "overlap";
    if (detail.includes("closed")) return "closed";
  }

  if (error.status === 422 && detail.includes("before")) return "laterReport";

  return null;
}

/** The guest's other group in a 409 `in another group` (name and date only). */
export function getOtherGroup(error: unknown): OtherGroup | null {
  if (!(error instanceof ApiError) || typeof error.body !== "object") {
    return null;
  }

  const group = (error.body as { otherGroup?: Partial<OtherGroup> } | null)
    ?.otherGroup;

  return group &&
    typeof group.id === "number" &&
    typeof group.name === "string" &&
    typeof group.joinedAt === "string"
    ? { id: group.id, name: group.name, joinedAt: group.joinedAt }
    : null;
}
