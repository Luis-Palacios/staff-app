import { z } from "zod";

// Mirrors the API's limits (membership-management schemas/small_group_reports.py).
export const ADDRESS_MAX = 255;
export const TEXT_MAX = 1024;
export const REASON_MAX = 255;

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

// An item is segments: plain text or a tagged person (`{ type, id }`; the API fills in the name).
// The 20 items, 1024 characters and 10 tags limits are the API's, which answers 422 with a text
// the form maps; here only the shape is checked.
const itemSchema = z.object({
  segments: z.array(
    z.discriminatedUnion("type", [
      z.strictObject({ type: z.literal("text"), text: z.string() }),
      z.strictObject({
        type: z.literal("person"),
        person: z.strictObject({
          type: z.enum(["member", "guest"]),
          id: z.number().int().positive(),
        }),
      }),
    ]),
  ),
});

/**
 * The body for create and save, as the server actions check it before calling the API. An answer
 * is null while a person is still unanswered, which only a draft allows (auto-save rule 4): the
 * API refuses a null on a submitted report with 422 `incomplete`.
 */
export const reportBodySchema = z.object({
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: optionalText(ADDRESS_MAX),
  sections: z.object({
    prayer: z.array(itemSchema),
    praise: z.array(itemSchema),
    followUp: z.array(itemSchema),
  }),
  replacesNoMeeting: z.boolean().optional(),
  status: z.enum(["draft", "submitted"]).optional(),
  version: z.number().int().positive().optional(),
  // A member's `memberId` or a guest's `guestId`, never both.
  attendances: z.array(
    z.union([
      z.strictObject({
        memberId: z.number().int().positive(),
        attendedGroup: z.boolean().nullable(),
        attendedChurch: z.boolean().nullable(),
        observation: optionalText(TEXT_MAX),
      }),
      z.strictObject({
        guestId: z.number().int().positive(),
        attendedGroup: z.boolean().nullable(),
        attendedChurch: z.boolean().nullable(),
        observation: optionalText(TEXT_MAX),
      }),
    ]),
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
