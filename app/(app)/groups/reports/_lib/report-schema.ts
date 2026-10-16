import { z } from "zod";

// Mirrors the API's limits (membership-management schemas/small_group_reports.py).
export const ADDRESS_MAX = 255;
export const TEXT_MAX = 1024;
export const REASON_MAX = 255;

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

/**
 * The body for create and edit, as the server actions check it before calling
 * the API. The form keeps answers as `boolean | null` while a person is still
 * unanswered; only a complete report gets here (rule 3), so a null is invalid.
 */
export const reportBodySchema = z.object({
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: optionalText(ADDRESS_MAX),
  groupPrayerRequest: optionalText(TEXT_MAX),
  groupPraiseReport: optionalText(TEXT_MAX),
  groupRelevantDiscussion: optionalText(TEXT_MAX),
  replacesNoMeeting: z.boolean().optional(),
  attendances: z.array(
    z.object({
      memberId: z.number().int().positive(),
      attendedGroup: z.boolean(),
      attendedChurch: z.boolean(),
      observation: optionalText(TEXT_MAX),
    }),
  ),
});

/** A date the group didn't meet. A blank reason is sent as none. */
export const noMeetingSchema = z.object({
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notHeldReason: z
    .string()
    .trim()
    .max(REASON_MAX)
    .nullable()
    .optional()
    .transform((reason) => reason || undefined),
});
