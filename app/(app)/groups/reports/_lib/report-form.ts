/**
 * The editor's form state (`ReportDraft`) to and from the API: a saved report opened in the
 * editor, and the body each auto-save sends. Shared by new reports, drafts and submitted ones.
 */

import type {
  ReportDetail,
  ReportInput,
  ReportRoster,
  ReportSectionKey,
  ReportSectionsInput,
} from "@/api/small-groups-api/types";
import type { ReportDraft } from "./report-draft";

import { personKey } from "./person";
import {
  type DraftItem,
  type DraftItems,
  type DraftSegment,
  isEmptyItem,
  newDraftItem,
  toItemInput,
} from "./report-items-draft";

/** The report's items as the form holds them: a person keeps their name, never `viewable`. */
function itemsOf(report: ReportDetail): DraftItems {
  const section = (key: ReportSectionKey): DraftItem[] =>
    report.sections[key].length > 0
      ? report.sections[key].map((item) =>
          newDraftItem(
            item.segments.map(
              (segment): DraftSegment =>
                segment.type === "text"
                  ? segment
                  : {
                      type: "person",
                      person: {
                        type: segment.person.type,
                        id: segment.person.id,
                        name: segment.person.name,
                      },
                    },
            ),
          ),
        )
      : [newDraftItem()];

  return {
    prayer: section("prayer"),
    praise: section("praise"),
    followUp: section("followUp"),
  };
}

/** A saved report (draft or submitted) as the editor's form: answers keyed by `personKey`. */
export function formFromReport(report: ReportDetail): ReportDraft {
  return {
    address: report.address ?? "",
    items: itemsOf(report),
    met: true,
    reason: "",
    replacing: false,
    answers: Object.fromEntries(
      report.attendances.map((row) => [
        personKey(row.person),
        {
          attendedGroup: row.attendedGroup,
          attendedChurch: row.attendedChurch,
          observation: row.observation ?? "",
        },
      ]),
    ),
  };
}

/** The form's items as the API takes them; empty ones are left out (rule 2). */
function sectionsOf(draft: ReportDraft): ReportSectionsInput {
  const items = (section: ReportSectionKey) =>
    draft.items[section].filter((item) => !isEmptyItem(item)).map(toItemInput);

  return {
    prayer: items("prayer"),
    praise: items("praise"),
    followUp: items("followUp"),
  };
}

/**
 * The body of one save: every person on the roster for the date, in roster order (rule 3), with a
 * null for each answer not given yet (auto-save rule 4: only a draft takes that). `complete` says
 * whether everyone has both answers. `includeObservations` false (reports rule 9: the caller can't
 * see them) leaves the field out of every row, so the API keeps what it has.
 */
export function toReportBody(
  draft: ReportDraft,
  roster: ReportRoster,
  date: string,
  includeObservations: boolean,
): { body: ReportInput; complete: boolean } {
  let complete = true;
  const attendances = roster.people.map((person) => {
    const answer = draft.answers[personKey(person.person)];
    const attendedGroup = answer?.attendedGroup ?? null;
    const attendedChurch = answer?.attendedChurch ?? null;

    if (attendedGroup === null || attendedChurch === null) complete = false;

    return {
      ...(person.person.type === "guest"
        ? { guestId: person.person.id }
        : { memberId: person.person.id }),
      attendedGroup,
      attendedChurch,
      ...(includeObservations && {
        observation: answer?.observation.trim() || null,
      }),
    } as ReportInput["attendances"][number];
  });

  return {
    body: {
      meetingDate: date,
      address: draft.address.trim() || null,
      sections: sectionsOf(draft),
      attendances,
    },
    complete,
  };
}

/** How many tags an item list carries, to tell typing from adding a tag. */
function shape(items: DraftItem[]): string {
  return items
    .map(
      (item) =>
        item.segments.filter((segment) => segment.type === "person").length,
    )
    .join(",");
}

/**
 * Whether an items change is typing (saved after a pause) or a tap (saved at once): adding or
 * removing an item or a tag is a tap (rule 6).
 */
export function itemsChangeKind(
  before: DraftItem[],
  after: DraftItem[],
): "tap" | "text" {
  return shape(before) === shape(after) ? "text" : "tap";
}

/** People on `next` who weren't on `previous`, by name: the roster-changed notice (rule 11). */
export function addedPeople(
  previous: ReportRoster,
  next: ReportRoster,
): string[] {
  const before = new Set(previous.people.map((row) => personKey(row.person)));

  return next.people
    .filter((row) => !before.has(personKey(row.person)))
    .map((row) => row.name);
}

/** The first person (in the given order) with either answer missing; -1 when everyone is done. */
export function firstOpenIndex(
  people: { person: ReportRoster["people"][number]["person"] }[],
  answers: ReportDraft["answers"],
): number {
  return people.findIndex((row) => {
    const answer = answers[personKey(row.person)];

    return (
      !answer || answer.attendedGroup === null || answer.attendedChurch === null
    );
  });
}
