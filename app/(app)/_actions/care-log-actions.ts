"use server";

import type {
  CareLogAudience,
  CareLogAudienceInput,
  CareLogCompleteInput,
  CareLogCreateInput,
  CareLogEntry,
  CareLogErrorCode,
  CareLogPersonOption,
  CareLogUpdateInput,
} from "@/api/care-log-api/types";
import type { MemberOption } from "@/api/members-api/types";

import { getTranslations } from "next-intl/server";

import { ApiError } from "@/api/api-client";
import { listMemberOptions } from "@/api/members-api/client";
import {
  cancelCareLogEntry,
  checkCareLogAudience,
  completeCareLogEntry,
  createCareLogEntry,
  createCareLogNote,
  deleteCareLogEntry,
  deleteCareLogNote,
  updateCareLogNote,
  searchCareLogPeople,
  updateCareLogEntry,
} from "@/api/care-log-api/client";
import { forbiddenUnless } from "@/lib/auth/get-permissions";

/** What the form tells apart; `link` is a banner, the rest sit under the field they belong to. */
export type CareLogFailureCode =
  | CareLogErrorCode
  | "forbidden"
  | "notFound"
  | "noteGone"
  | "generic";

export type CareLogResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: CareLogFailureCode; message: string };

const API_CODES: ReadonlySet<string> = new Set<CareLogErrorCode>([
  "kind_status",
  "date",
  "text",
  "others",
  "heard_from",
  "meeting_mode",
  "people",
  "participants",
  "reason",
  "status",
  "source",
  "kind",
  "visibility",
  "link",
  "not_planned",
  "author",
  "not_participant",
  "not_note_writer",
  "note_exists",
  "not_done",
  "no_participants",
]);

/** The API's `code` (never its English `detail`), else the status. */
function failureCode(error: unknown): CareLogFailureCode {
  if (!(error instanceof ApiError)) return "generic";

  const code = (error.body as { code?: unknown } | null)?.code;

  if (typeof code === "string" && API_CODES.has(code)) {
    return code as CareLogErrorCode;
  }

  if (error.status === 403) return "forbidden";
  if (error.status === 404) return "notFound";

  return "generic";
}

type NoteFailureCode =
  | "not_participant"
  | "not_note_writer"
  | "note_exists"
  | "not_done"
  | "no_participants"
  | "noteGone";

function isNoteCode(code: CareLogFailureCode): code is NoteFailureCode {
  return (
    code === "not_participant" ||
    code === "not_note_writer" ||
    code === "note_exists" ||
    code === "not_done" ||
    code === "no_participants" ||
    code === "noteGone"
  );
}

async function failure<T>(code: CareLogFailureCode): Promise<CareLogResult<T>> {
  const t = await getTranslations("CareLog");

  // Two smaller unions: one template key over every code is too big for next-intl's key types
  // (tsc then asks for ICU arguments no message has).
  const message = isNoteCode(code) ? t(`errors.${code}`) : t(`errors.${code}`);

  return { ok: false, code, message };
}

/** A server action is a public endpoint: the permission is checked here, then again by the API. */
function forbidden() {
  return forbiddenUnless({ careLog: ["create"] });
}

async function run<T>(call: () => Promise<T>): Promise<CareLogResult<T>> {
  if (await forbidden()) return failure("forbidden");

  try {
    return { ok: true, value: await call() };
  } catch (error) {
    return failure(failureCode(error));
  }
}

/**
 * A note's call: the same as `run`, but a plain 404 means the note or the entry is gone, not
 * "someone in About" (the entry form's wording).
 */
async function runNote<T>(call: () => Promise<T>): Promise<CareLogResult<T>> {
  const result = await run(call);

  return !result.ok && result.code === "notFound"
    ? failure("noteGone")
    : result;
}

/** The people picker: up to 10 people in the caller's scope; 2 or more characters. */
export async function searchCareLogPeopleAction(
  query: string,
): Promise<CareLogResult<CareLogPersonOption[]>> {
  const text = query.trim();

  if (text.length < 2) return { ok: true, value: [] };

  return run(() => searchCareLogPeople(text.slice(0, 100)));
}

/**
 * Members to pick under *Who else took part* (names only, `members: search`). Loaded once when
 * the picker opens and filtered in the browser.
 */
export async function listCareLogParticipantOptionsAction(): Promise<
  CareLogResult<MemberOption[]>
> {
  if (await forbiddenUnless({ members: ["search"] })) {
    return failure("forbidden");
  }

  return run(() => listMemberOptions());
}

export async function createCareLogAction(
  input: CareLogCreateInput,
): Promise<CareLogResult<CareLogEntry>> {
  return run(() => createCareLogEntry(input));
}

export async function updateCareLogAction(
  id: number,
  changes: CareLogUpdateInput,
): Promise<CareLogResult<CareLogEntry>> {
  return run(() => updateCareLogEntry(id, changes));
}

export async function deleteCareLogAction(
  id: number,
): Promise<CareLogResult<null>> {
  return run(async () => {
    await deleteCareLogEntry(id);

    return null;
  });
}

export async function completeCareLogAction(
  id: number,
  input: CareLogCompleteInput,
): Promise<CareLogResult<CareLogEntry>> {
  return run(() => completeCareLogEntry(id, input));
}

export async function cancelCareLogAction(
  id: number,
  reason?: string,
): Promise<CareLogResult<CareLogEntry>> {
  return run(() => cancelCareLogEntry(id, reason));
}

/** *Add your note* (Part 1c): one per person on a done entry with participants. */
export async function addCareLogNoteAction(
  id: number,
  text: string,
): Promise<CareLogResult<CareLogEntry>> {
  return runNote(() => createCareLogNote(id, text.trim()));
}

export async function updateCareLogNoteAction(
  id: number,
  noteId: number,
  text: string,
): Promise<CareLogResult<CareLogEntry>> {
  return runNote(() => updateCareLogNote(id, noteId, text.trim()));
}

export async function deleteCareLogNoteAction(
  id: number,
  noteId: number,
): Promise<CareLogResult<null>> {
  return runNote(async () => {
    await deleteCareLogNote(id, noteId);

    return null;
  });
}

/** Who among the participants gains the entry by being named (rule 3's warning). */
export async function checkCareLogAudienceAction(
  input: CareLogAudienceInput,
): Promise<CareLogResult<CareLogAudience>> {
  return run(() => checkCareLogAudience(input));
}
