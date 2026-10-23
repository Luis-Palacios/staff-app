import { z } from "zod";

import {
  ADDRESS_MAX,
  NAME_MAX,
  PHONE_MAX,
} from "@/app/(app)/members/_lib/member-schema";

/**
 * The guest fields as the form holds them: plain strings, "" meaning "not provided". Messages are
 * keys under `GuestForm.errors`, not English text. Shared by the form and the server actions.
 */

export const GUEST_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "sex",
  "firstVisitDate",
] as const;

export type GuestField = (typeof GUEST_FIELDS)[number];

export type GuestErrorKey =
  | "nameRequired"
  | "emailInvalid"
  | "phoneTooLong"
  | "phoneDigitsOnly"
  | "addressTooLong"
  | "sexInvalid"
  | "firstVisitInvalid";

export type GuestFieldErrors = Partial<Record<GuestField, GuestErrorKey>>;

export type GuestFormValues = Record<GuestField, string>;

export const guestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "nameRequired" satisfies GuestErrorKey })
    .max(NAME_MAX, { error: "nameRequired" satisfies GuestErrorKey }),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      error: "emailInvalid" satisfies GuestErrorKey,
    }),
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX, { error: "phoneTooLong" satisfies GuestErrorKey }),
  address: z
    .string()
    .trim()
    .max(ADDRESS_MAX, { error: "addressTooLong" satisfies GuestErrorKey }),
  sex: z.enum(["", "male", "female"], {
    error: "sexInvalid" satisfies GuestErrorKey,
  }),
  firstVisitDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      error: "firstVisitInvalid" satisfies GuestErrorKey,
    }),
});

/** For edits: only the fields that changed are present. */
export const guestChangesSchema = guestSchema.partial();

/** First error per field, as a message key. */
export function toGuestFieldErrors(error: z.ZodError): GuestFieldErrors {
  const fieldErrors: GuestFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      (GUEST_FIELDS as readonly string[]).includes(field) &&
      !fieldErrors[field as GuestField]
    ) {
      fieldErrors[field as GuestField] = issue.message as GuestErrorKey;
    }
  }

  return fieldErrors;
}
