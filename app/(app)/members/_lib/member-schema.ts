import { z } from "zod";

/**
 * The five fields the API lets us change, as the form holds them: plain
 * strings, where "" means "not provided". Shared by the form and the server
 * actions. Messages are keys under `MemberForm.errors` (see messages/en.json),
 * not English text.
 */

export const MEMBER_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "birthDate",
] as const;

export type MemberField = (typeof MEMBER_FIELDS)[number];

export type MemberErrorKey =
  | "nameRequired"
  | "emailInvalid"
  | "emailDuplicate"
  | "phoneTooLong"
  | "phoneDigitsOnly"
  | "addressTooLong"
  | "birthDateInvalid";

export type MemberFieldErrors = Partial<Record<MemberField, MemberErrorKey>>;

export type MemberFormValues = Record<MemberField, string>;

// Mirrors the API's limits (membership-management schemas/members.py).
export const NAME_MAX = 255;
export const PHONE_MAX = 20;
export const ADDRESS_MAX = 255;
export const MIN_BIRTH_YEAR = 1900;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" in today's calendar, for comparing date-only strings. */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

export function isValidBirthDate(value: string): boolean {
  const match = ISO_DATE.exec(value);

  if (!match) return false;

  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate && year >= MIN_BIRTH_YEAR && value <= todayIso();
}

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    error: "emailInvalid" satisfies MemberErrorKey,
  });

export const memberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "nameRequired" satisfies MemberErrorKey })
    .max(NAME_MAX, { error: "nameRequired" satisfies MemberErrorKey }),
  email: optionalEmail,
  // The whole stored string, "+505 8590 4417". The digits-only rule applies to
  // the number part, which only the form can tell apart.
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX, { error: "phoneTooLong" satisfies MemberErrorKey }),
  address: z
    .string()
    .trim()
    .max(ADDRESS_MAX, { error: "addressTooLong" satisfies MemberErrorKey }),
  birthDate: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidBirthDate(value), {
      error: "birthDateInvalid" satisfies MemberErrorKey,
    }),
});

/** For edits: only the fields that changed are present. */
export const memberChangesSchema = memberSchema.partial();

/** First error per field, as a message key. */
export function toFieldErrors(error: z.ZodError): MemberFieldErrors {
  const fieldErrors: MemberFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      (MEMBER_FIELDS as readonly string[]).includes(field) &&
      !fieldErrors[field as MemberField]
    ) {
      fieldErrors[field as MemberField] = issue.message as MemberErrorKey;
    }
  }

  return fieldErrors;
}
