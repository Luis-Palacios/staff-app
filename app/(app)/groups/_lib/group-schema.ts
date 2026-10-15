import type { Weekday } from "@/api/small-groups-api/types";

import { z } from "zod";

/**
 * The three fields the API lets us change, as the form holds them. Shared by
 * the form and the server actions. Messages are keys under `GroupForm.errors`
 * (see messages/en.json), not English text.
 */

export const GROUP_FIELDS = ["name", "meetingDay", "meetingAddress"] as const;

export type GroupField = (typeof GROUP_FIELDS)[number];

export type GroupErrorKey = "nameRequired" | "addressTooLong";

export type GroupFieldErrors = Partial<Record<GroupField, GroupErrorKey>>;

/** `meetingDay` is null for "Not set"; `meetingAddress` "" means not provided. */
export interface GroupFormValues {
  name: string;
  meetingDay: Weekday | null;
  meetingAddress: string;
}

// Mirrors the API's limits (membership-management schemas/small_groups.py).
export const NAME_MAX = 255;
export const ADDRESS_MAX = 255;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "nameRequired" satisfies GroupErrorKey })
    .max(NAME_MAX, { error: "nameRequired" satisfies GroupErrorKey }),
  meetingDay: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ])
    .nullable(),
  meetingAddress: z
    .string()
    .trim()
    .max(ADDRESS_MAX, { error: "addressTooLong" satisfies GroupErrorKey }),
});

/** For edits: only the fields that changed are present. */
export const groupChangesSchema = groupSchema.partial();

/** First error per field, as a message key. */
export function toFieldErrors(error: z.ZodError): GroupFieldErrors {
  const fieldErrors: GroupFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      (GROUP_FIELDS as readonly string[]).includes(field) &&
      !fieldErrors[field as GroupField]
    ) {
      fieldErrors[field as GroupField] = issue.message as GroupErrorKey;
    }
  }

  return fieldErrors;
}
