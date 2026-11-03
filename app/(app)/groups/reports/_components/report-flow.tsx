"use client";

import type {
  ReportDetail,
  ReportInput,
  ReportRoster,
} from "@/api/small-groups-api/types";
import type { ReportFailure } from "@/app/(app)/groups/reports/_actions/report-actions";
import type { DateProblem } from "@/app/(app)/groups/reports/_components/date-problem-note";
import type {
  AttendanceMode,
  FlowGroup,
  NoMeetingOnDate,
} from "@/app/(app)/groups/reports/_components/meeting-step";
import type { ChangeKind } from "@/app/(app)/groups/reports/_lib/report-autosave";
import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Description,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { DateProblemNote } from "./date-problem-note";
import { GroupStep } from "./group-step";
import { MeetingDatePicker } from "./meeting-date-picker";
import { MeetingStep } from "./meeting-step";
import { PersonStep } from "./person-step";
import { ReportBanner } from "./report-banner";
import { ReportFooterStatus } from "./report-footer-status";
import { useReportGuests } from "./report-guests";
import { isMarked, ReportListStep } from "./report-list-step";
import { ReportStepper } from "./report-stepper";
import { ReportStatusPill, SaveStatus } from "./save-status";

import { isHiddenDraft } from "@/api/small-groups-api/types";
import {
  createReportAction,
  deleteReportAction,
  getReportRosterAction,
  leaveReportAction,
  listReportedDatesAction,
  markNoMeeting,
  saveReportAction,
  submitReportAction,
  type ReportedDates,
} from "@/app/(app)/groups/reports/_actions/report-actions";
import { formatChurchSunday } from "@/app/(app)/groups/reports/_lib/format-church-sunday";
import { toReportInput } from "@/app/(app)/groups/reports/_lib/report-body";
import { defaultMeetingDate } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { guestsFirst, personKey } from "@/app/(app)/groups/reports/_lib/person";
import { emptyDraftItems } from "@/app/(app)/groups/reports/_lib/report-items-draft";
import { tagContextOf } from "@/app/(app)/groups/reports/_lib/report-tags";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type ReportDraft,
  type ReportDraftAnswer,
} from "@/app/(app)/groups/reports/_lib/report-draft";
import {
  addedPeople,
  formFromReport,
  itemsChangeKind,
  toReportBody,
} from "@/app/(app)/groups/reports/_lib/report-form";
import {
  clearOutbox,
  loadOutbox,
  useReportAutosave,
} from "@/app/(app)/groups/reports/_lib/report-autosave";
import { ADDRESS_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { card, title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import {
  formatCalendarFullDate,
  formatCalendarShortDate,
  formatCalendarShortWeekdayDate,
} from "@/lib/format-date";

/** What the roster call said about the chosen group and date. */
type RosterState =
  | { status: "loading" }
  | {
      status: "ready";
      roster: ReportRoster;
      existsMessage: string | null;
      /** The reason on the date's no-meeting mark, when it has one. */
      noMeetingReason: string | null;
    }
  | { status: "error"; message: string };

/** `list`: a saved report (draft or submitted) on its full list, with the date and place on top. */
type Step = "meeting" | "people" | "group" | "review" | "quick" | "list";

/** A report the editor opens: a draft or a submitted one, and the roster for its date. */
export interface ExistingReport {
  report: ReportDetail;
  roster: ReportRoster;
  /** "Submitted by … · Last edited by …"; null for a draft. */
  meta: string | null;
}

const TOTAL_STEPS = 4;
// The quick list has no steps: it is one screen, so no stepper and no "n / 4".
const STEP_NUMBER = { meeting: 1, people: 2, group: 3, review: 4 } as const;
/** Failures that belong on the date field: the leader has to pick another date. */
const DATE_FAILURES: readonly (string | undefined)[] = [
  "exists",
  "future",
  "notLeaderOnDate",
  "draftInProgress",
];
const NO_ANSWER: ReportDraftAnswer = {
  attendedGroup: null,
  attendedChurch: null,
  observation: "",
};

function emptyDraft(address: string): ReportDraft {
  return {
    address,
    items: emptyDraftItems(),
    met: true,
    reason: "",
    replacing: false,
    answers: {},
  };
}

/** Everyone has both answers: a submitted report can only be saved like this (rule 5). */
function isComplete(body: ReportInput): boolean {
  return body.attendances.every(
    (row) => row.attendedGroup !== null && row.attendedChurch !== null,
  );
}

/** An input, a text area or the item editor: the fields whose typing waits for a pause. */
function isTextField(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable)
  );
}

/**
 * The one report editor. A new report: the meeting, one person at a time, the group, then the full
 * list to review and submit. A saved report (`existing`, a draft or a submitted one) opens on its
 * full list, and every change saves as it is made (auto-save): the save status says where the
 * latest change is, and there is no Save button.
 */
export function ReportFlow({
  groups,
  scoped,
  today,
  initialGroupId,
  initialDate,
  initialDates,
  initialRoster,
  existing,
}: {
  groups: FlowGroup[];
  scoped: boolean;
  today: string;
  initialGroupId: number;
  initialDate: string;
  initialDates: ReportedDates;
  initialRoster: Extract<RosterState, { status: "ready" }> | null;
  existing?: ExistingReport;
}) {
  const t = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [isSubmitting, startSubmit] = useTransition();
  const [isLeaving, startLeaving] = useTransition();
  const [groupId, setGroupId] = useState(initialGroupId);
  const [date, setDate] = useState(initialDate);
  const router = useRouter();
  const [filedDates, setFiledDates] = useState(
    () => new Set(initialDates.filed),
  );
  const [noMeetingDates, setNoMeetingDates] = useState(
    () => new Set(initialDates.noMeeting),
  );
  const [roster, setRoster] = useState<RosterState>(
    existing
      ? {
          status: "ready",
          roster: existing.roster,
          existsMessage: null,
          noMeetingReason: null,
        }
      : (initialRoster ?? { status: "loading" }),
  );
  const group = groups.find((option) => option.id === groupId) ?? groups[0];
  const [draft, setDraft] = useState(() =>
    existing
      ? formFromReport(existing.report)
      : emptyDraft(group.meetingAddress ?? ""),
  );
  // The latest draft, roster and date, readable between renders: two quick taps must not overwrite
  // each other, and a save built after a roster reload must use the new roster.
  const draftRef = useRef(draft);
  const rosterRef = useRef<ReportRoster | null>(existing?.roster ?? null);
  const dateRef = useRef(date);
  const [mode, setMode] = useState<AttendanceMode | null>(null);
  const [step, setStep] = useState<Step>(existing ? "list" : "meeting");
  const [personIndex, setPersonIndex] = useState(0);
  // Where Back from the review goes: the group step, or the person left when skipping to the list.
  const [reviewFrom, setReviewFrom] = useState<"group" | "people" | "meeting">(
    "group",
  );
  const [failure, setFailure] = useState<ReportFailure | null>(null);
  const [reloading, setReloading] = useState(false);
  // Names added by a roster reload (rule 11), for the notice; null when it didn't change.
  const [rosterChange, setRosterChange] = useState<string[] | null>(null);
  // The group and date the roster below belongs to, so the first render doesn't ask again.
  const loadedFor = useRef<string | null>(
    initialRoster || existing ? `${initialGroupId}:${initialDate}` : null,
  );
  const previousGroup = useRef(initialGroupId);
  const reportId = existing?.report.id ?? null;
  const submitted = existing?.report.status === "submitted";
  const observationsVisible = existing?.report.observationsVisible ?? true;

  function readyRoster(next: ReportRoster) {
    rosterRef.current = next;
  }

  /** The roster for the date again, after a 422 `attendance`: rebuild the report on it. */
  async function rosterForSave() {
    const before = rosterRef.current;
    const result = await getReportRosterAction(groupId, dateRef.current);

    if (!result.ok) return null;

    readyRoster(result.roster);
    setRoster({
      status: "ready",
      roster: result.roster,
      existsMessage: result.existsMessage,
      noMeetingReason: result.noMeetingReason,
    });

    if (before) setRosterChange(addedPeople(before, result.roster));

    return {
      body: toReportBody(
        draftRef.current,
        result.roster,
        dateRef.current,
        observationsVisible,
      ).body,
      form: draftRef.current,
    };
  }

  const autosave = useReportAutosave<ReportDraft>({
    reportId,
    version: existing?.report.version ?? 0,
    savedAt: existing
      ? (existing.report.lastEditedAt ??
        existing.report.submittedAt ??
        existing.report.startedAt)
      : null,
    save: saveReportAction,
    canSend: (body) => !submitted || isComplete(body),
    onRosterChanged: rosterForSave,
    onFailure: setFailure,
  });

  /** Sends the report as it is now (a saved report only). Waits while the roster is loading. */
  function pushChange(kind: ChangeKind) {
    const current = rosterRef.current;

    if (reportId === null || !current) return;

    autosave.change(
      toReportBody(
        draftRef.current,
        current,
        dateRef.current,
        observationsVisible,
      ).body,
      draftRef.current,
      kind,
    );
  }

  // A saved report: pick up a change this device made that the server doesn't have yet (the
  // connection dropped, or the tab closed before it synced). Storage is only readable here.
  useEffect(() => {
    if (!existing) return;

    const { report } = existing;
    const saved = loadOutbox<ReportDraft>({ reportId: report.id });

    if (!saved) return;

    const serverBody = toReportBody(
      formFromReport(report),
      existing.roster,
      report.meetingDate,
      report.observationsVisible,
    ).body;

    // The server already has it (the response was lost on the way back).
    if (JSON.stringify(saved.body) === JSON.stringify(serverBody)) {
      clearOutbox({ reportId: report.id });

      return;
    }

    if (saved.baseVersion === report.version) {
      draftRef.current = saved.form;
      setDraft(saved.form);
      autosave.engine.resume(saved.body, saved.form);

      // The change moved the date: show it, with that date's roster.
      if (saved.body.meetingDate !== report.meetingDate) {
        setDate(saved.body.meetingDate);
      }

      return;
    }

    // Someone saved after this device's change was made: it isn't merged (rule 9).
    autosave.engine.markConflict({
      version: report.version,
      lastEditedBy: report.lastEditedBy,
      lastEditedAt: report.lastEditedAt,
    });
    // Runs once per report; the engine and the report don't change while the editor is open.
  }, []);

  // Every group or date change: restore a new report's browser draft for that pair, then ask who
  // belongs on the report. A saved report sends its change once the new date's roster is in.
  useEffect(() => {
    const key = `${groupId}:${date}`;

    dateRef.current = date;

    if (!existing) {
      const saved = loadDraft(groupId, date);

      if (saved) {
        draftRef.current = saved;
        setDraft(saved);
      } else if (previousGroup.current !== groupId) {
        draftRef.current = emptyDraft(group.meetingAddress ?? "");
        setDraft(draftRef.current);
      } else if (draftRef.current.replacing) {
        // "Replace the no-meeting mark" belongs to one date; the next one starts with its own prompt.
        draftRef.current = { ...draftRef.current, replacing: false };
        setDraft(draftRef.current);
      }
    }

    previousGroup.current = groupId;

    if (loadedFor.current === key) return;

    let cancelled = false;

    loadedFor.current = key;
    rosterRef.current = null;
    setRoster({ status: "loading" });
    setFailure(null);

    if (!existing) {
      setMode(null);
      setStep("meeting");
    }

    void getReportRosterAction(groupId, date).then((result) => {
      if (cancelled) return;

      if (result.ok) readyRoster(result.roster);

      setRoster(
        result.ok
          ? {
              status: "ready",
              roster: result.roster,
              existsMessage: result.existsMessage,
              noMeetingReason: result.noMeetingReason,
            }
          : { status: "error", message: result.message },
      );

      if (result.ok && existing) pushChange("tap");
    });

    return () => {
      cancelled = true;
      loadedFor.current = null;
    };
    // pushChange and existing read refs and props that don't change while the editor is open.
  }, [groupId, date, group.meetingAddress]);

  // A new step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  function edit(patch: Partial<ReportDraft>, kind: ChangeKind = "tap") {
    const next = { ...draftRef.current, ...patch };

    draftRef.current = next;
    setDraft(next);

    if (existing) {
      pushChange(kind);
    } else {
      saveDraft(groupId, date, next);
    }
  }

  function answer(key: string, patch: Partial<ReportDraftAnswer>) {
    const { answers } = draftRef.current;

    edit(
      {
        answers: {
          ...answers,
          [key]: { ...(answers[key] ?? NO_ANSWER), ...patch },
        },
      },
      "observation" in patch ? "text" : "tap",
    );
  }

  function changeItems(
    section: keyof ReportDraft["items"],
    next: ReportDraft["items"][typeof section],
  ) {
    const before = draftRef.current.items[section];

    edit(
      { items: { ...draftRef.current.items, [section]: next } },
      itemsChangeKind(before, next),
    );
  }

  function changeGroup(nextId: number) {
    if (nextId === groupId) return;

    const next = groups.find((option) => option.id === nextId);

    if (!next) return;

    // The new group's filed dates decide its starting date, so switch group and date together.
    void listReportedDatesAction(nextId, today).then((dates) => {
      const filed = new Set(dates.filed);
      const noMeeting = new Set(dates.noMeeting);

      setFiledDates(filed);
      setNoMeetingDates(noMeeting);
      setGroupId(nextId);
      setDate(
        defaultMeetingDate({
          today,
          meetingDay: next.meetingDay,
          filedDates: new Set([...filed, ...noMeeting]),
        }),
      );
    });
  }

  function changeDate(next: string) {
    if (next === date) return;

    setFailure(null);
    setDate(next);
  }

  function chooseMode(next: AttendanceMode) {
    setMode(next);

    if (next === "quick" && roster.status === "ready") setStep("quick");

    if (next === "guided" && roster.status === "ready") {
      const firstOpen = guestsFirst(roster.roster.people).findIndex(
        (person) => !isMarked(draft.answers[personKey(person.person)]),
      );

      setPersonIndex(firstOpen === -1 ? 0 : firstOpen);
      setStep("people");
    }
  }

  function cancel() {
    clearDraft(groupId, date);
  }

  /** Done, Back to My reports: send what's pending, refresh the lists, then go. */
  function leave(href: string) {
    if (reportId === null) return;

    startLeaving(async () => {
      await autosave.engine.flush();
      await leaveReportAction(reportId, groupId);
      router.push(href);
    });
  }

  /** A new report, filed in one go (until the new-report flow saves drafts, stage 4). */
  function submitNew() {
    if (roster.status !== "ready") return;

    const body = toReportInput(draft, roster.roster, date, true);

    if (!body) return;

    // Only while the date still holds the mark does the API get asked to replace it.
    const input = replacing ? { ...body, replacesNoMeeting: true } : body;

    setFailure(null);
    // A successful submit redirects and never comes back, so the draft goes first and returns on failure.
    clearDraft(groupId, date);
    startSubmit(async () => {
      const result = await createReportAction(groupId, {
        ...input,
        status: "submitted",
      });

      if (result.ok) {
        router.push(`/groups/reports/${result.id}?saved=submitted`);

        return;
      }

      saveDraft(groupId, date, draftRef.current);
      setFailure(result);

      // A date problem is fixed on the meeting step; anything else stays on the review.
      if (DATE_FAILURES.includes(result.kind)) setStep("meeting");
    });
  }

  /** Submit a draft (rule 5): the pending save goes first, and submit uses its version. */
  function submitDraft() {
    if (reportId === null) return;

    setFailure(null);
    startSubmit(async () => {
      const version = await autosave.engine.flush();

      // The save status and banner say why it didn't save.
      if (version === null) return;

      const result = await submitReportAction(reportId, groupId, version);

      // Success redirects to the report.
      if (result.kind === "conflict" && result.conflict) {
        autosave.engine.markConflict(result.conflict);

        return;
      }

      if (result.kind === "rosterChanged") {
        // Someone joined or left since the last save: reload, save, and let the leader answer
        // the new people before submitting again.
        const rebuilt = await rosterForSave();

        if (rebuilt) autosave.change(rebuilt.body, rebuilt.form, "blur");

        return;
      }

      setFailure(result);
    });
  }

  /** Discard the draft: nothing more is sent, and the device copy goes with it. */
  function discardDraft() {
    if (reportId === null) return;

    autosave.engine.dispose();
    clearOutbox({ reportId });
    startSubmit(async () => {
      setFailure(await deleteReportAction(reportId, groupId));
    });
  }

  function saveNoMeeting() {
    setFailure(null);
    startSubmit(async () => {
      const result = await markNoMeeting(groupId, date, draft.reason);

      if (result.ok) {
        clearDraft(groupId, date);
        router.push("/groups/reports?saved=marked");

        return;
      }

      setFailure(result);
    });
  }

  function reloadPeople() {
    setReloading(true);
    void getReportRosterAction(groupId, date).then((result) => {
      setReloading(false);

      if (!result.ok) return;

      readyRoster(result.roster);
      // Answers stay keyed by member, so people still on the roster keep theirs.
      setRoster({
        status: "ready",
        roster: result.roster,
        existsMessage: result.existsMessage,
        noMeetingReason: result.noMeetingReason,
      });
      setFailure(null);
    });
  }

  // The roster for the chosen group and date, replacing the one shown; null when it can't be read.
  // A saved report saves on it at once: a guest added or removed changes who is on the report.
  async function refreshRoster(): Promise<ReportRoster | null> {
    const result = await getReportRosterAction(groupId, date);

    if (!result.ok) return null;

    readyRoster(result.roster);
    setRoster({
      status: "ready",
      roster: result.roster,
      existsMessage: result.existsMessage,
      noMeetingReason: result.noMeetingReason,
    });
    pushChange("tap");

    return result.roster;
  }

  const ready = roster.status === "ready" ? roster : null;
  const audience = ready?.roster.smallGroup.audience ?? "members";
  // A guest group lists its guests first, in the quick list, the review and one person at a time.
  const people = guestsFirst(ready?.roster.people ?? []);
  const guestActions = useReportGuests({
    groupId,
    groupName: group.name,
    audience,
    closed: ready?.roster.smallGroup.closedAt != null,
    date,
    today,
    reload: refreshRoster,
    onAdded: (next, key) => {
      // They came: the first question is answered, the church one is still theirs to answer.
      answer(key, { attendedGroup: true });

      // One person at a time: go to the new guest, who now needs the second answer.
      if (step === "people") {
        const index = guestsFirst(next.people).findIndex(
          (row) => personKey(row.person) === key,
        );

        if (index !== -1) setPersonIndex(index);
      }
    },
  });
  const existingOnDate = ready?.roster.existingReport ?? null;
  // Someone else's draft holds the date: no id to open (auto-save rule 17).
  const hiddenDraft = isHiddenDraft(existingOnDate);
  // The report being edited holds its own date; it isn't a duplicate (rule 1).
  const visible =
    existingOnDate &&
    !isHiddenDraft(existingOnDate) &&
    existingOnDate.id !== reportId
      ? existingOnDate
      : null;
  // A no meeting on the date can be replaced by a new report; a held report there is a duplicate.
  const noMeetingId = visible && !visible.held && !existing ? visible.id : null;
  const exists = visible && (visible.held || existing) ? visible.id : null;
  const replacing = noMeetingId !== null && draft.replacing;
  const noMeetingOnDate: NoMeetingOnDate | null =
    ready && noMeetingId !== null
      ? {
          existingReportId: noMeetingId,
          reason: ready.noMeetingReason,
          replacing,
        }
      : null;
  const dateFailure =
    failure && DATE_FAILURES.includes(failure.kind)
      ? {
          message: failure.message,
          existingReportId: failure.existingReportId ?? null,
        }
      : null;
  const rosterProblem: DateProblem | null =
    ready && exists !== null
      ? {
          message:
            ready.existsMessage ??
            (visible?.status === "draft" ? t("draftYours") : ""),
          existingReportId: exists,
        }
      : hiddenDraft
        ? { message: t("draftInProgress"), existingReportId: null }
        : roster.status === "error"
          ? { message: roster.message, existingReportId: null }
          : null;
  const dateProblem = dateFailure ?? rosterProblem;
  const noPeople = ready !== null && people.length === 0;
  const sundayLabel = ready
    ? formatChurchSunday(ready.roster.churchSunday, locale)
    : "";
  const shortSundayLabel = ready
    ? formatCalendarShortWeekdayDate(ready.roster.churchSunday, locale)
    : "";
  const markedCount = people.filter((person) =>
    isMarked(draft.answers[personKey(person.person)]),
  ).length;
  const remaining = people.length - markedCount;
  const tagContext = tagContextOf({
    groupId,
    groupName: group.name,
    people,
    answers: draft.answers,
  });
  const heading = submitted
    ? t("editTitle")
    : step === "review"
      ? t("reviewTitle")
      : t("newTitle");
  // The quick list has no number, and neither has saving a no meeting from step 1 or a saved report.
  const numbered =
    step === "quick" ||
    step === "list" ||
    (step === "meeting" && !draft.met && !noMeetingOnDate)
      ? null
      : STEP_NUMBER[step];
  const person = people[personIndex];
  const blocking =
    failure !== null && !DATE_FAILURES.includes(failure.kind) ? failure : null;
  const save = autosave.state;
  const statusWord = existing
    ? submitted
      ? t("submittedPill")
      : t("draftPill")
    : null;
  const closeHref =
    existing && submitted ? `/groups/reports/${reportId}` : "/groups/reports";
  const banner =
    save.status === "conflict" ? (
      <ReportBanner
        alert
        action={{
          label: t("reload"),
          onPress: () => {
            autosave.engine.discardDevice();
            window.location.reload();
          },
        }}
        body={t("conflictBody")}
        icon={UsersIcon}
        title={
          save.conflict.lastEditedBy
            ? t("conflictTitle", { name: save.conflict.lastEditedBy.name })
            : t("conflictTitleSomeone")
        }
        tone="danger"
      />
    ) : save.status === "error" ? (
      <ReportBanner
        alert
        action={{
          label: t("retryNow"),
          onPress: () => autosave.engine.retry(),
        }}
        body={save.retrying ? t("errorBody") : save.message}
        icon={ExclamationCircleIcon}
        title={t("errorTitle")}
        tone="danger"
      />
    ) : save.status === "offline" ? (
      <ReportBanner
        body={t("offlineBody")}
        icon={DevicePhoneMobileIcon}
        title={t("offlineTitle")}
        tone="warning"
      />
    ) : rosterChange !== null && (step === "list" || step === "quick") ? (
      <ReportBanner
        body={
          rosterChange.length > 0
            ? t("rosterAdded", {
                names: new Intl.ListFormat(locale, {
                  type: "conjunction",
                }).format(rosterChange),
                count: rosterChange.length,
              })
            : t("rosterRemoved")
        }
        icon={InformationCircleIcon}
        title={t("rosterTitle")}
        tone="accent"
      />
    ) : null;
  const breadcrumbs = existing
    ? submitted
      ? [
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          {
            label: `${group.name}, ${formatCalendarShortDate(existing.report.meetingDate, locale)}`,
            href: `/groups/reports/${reportId}`,
          },
          { label: heading, href: `/groups/reports/${reportId}/edit` },
        ]
      : [
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          { label: heading, href: `/groups/reports/${reportId}/edit` },
        ]
    : [
        groupsBreadcrumb,
        groupsReportsBreadcrumb,
        { label: heading, href: "/groups/reports/new" },
      ];
  const listFooter = existing ? (
    <>
      {!submitted && (
        <Button
          className="gap-1.5 px-3 font-semibold text-danger"
          isDisabled={isSubmitting}
          variant="ghost"
          onPress={discardDraft}
        >
          <TrashIcon
            aria-hidden="true"
            className="size-[17px]"
            strokeWidth={1.8}
          />
          {t("discard")}
        </Button>
      )}
      <ReportFooterStatus
        doneHint={submitted ? t("liveHint") : undefined}
        failure={blocking}
        reloading={reloading}
        remaining={remaining}
        onReload={reloadPeople}
      />
      <div className="flex w-full flex-wrap gap-3 sm:w-auto">
        {submitted ? (
          <Button
            className="flex-1 gap-2 font-semibold sm:flex-none"
            isPending={isLeaving}
            onPress={() => leave(`/groups/reports/${reportId}`)}
          >
            <CheckIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
            {t("done")}
          </Button>
        ) : (
          <Button
            className="flex-1 gap-2 font-semibold sm:flex-none"
            isDisabled={remaining > 0 || noPeople || save.status === "conflict"}
            isPending={isSubmitting}
            onPress={submitDraft}
          >
            <CheckIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
            {t("submit")}
          </Button>
        )}
      </div>
    </>
  ) : (
    <>
      <ReportFooterStatus
        failure={blocking}
        reloading={reloading}
        remaining={remaining}
        onReload={reloadPeople}
      />
      <div className="flex w-full flex-wrap gap-3 sm:w-auto">
        <Button
          className="flex-1 gap-2 font-semibold sm:flex-none"
          isDisabled={isSubmitting}
          variant="outline"
          onPress={() =>
            step === "quick"
              ? setStep("meeting")
              : reviewFrom === "group"
                ? setStep("group")
                : setStep("people")
          }
        >
          <ArrowLeftIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
          {t("back")}
        </Button>
        <Button
          className="flex-1 gap-2 font-semibold sm:flex-none"
          isDisabled={remaining > 0 || noPeople}
          isPending={isSubmitting}
          onPress={submitNew}
        >
          <CheckIcon aria-hidden="true" className="size-4" strokeWidth={2.2} />
          {t("submit")}
        </Button>
      </div>
    </>
  );

  return (
    // Typing waits for a pause; leaving the field sends it at once (rule 6).
    <div
      className="contents"
      onBlurCapture={(event) => {
        if (isTextField(event.target)) autosave.engine.blur();
      }}
    >
      {/* Phone: a focused task header replaces the top bar. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-1 border-b border-border bg-background pl-2 pr-3 md:hidden">
        <NextLink
          aria-label={t("close")}
          className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary"
          href={closeHref}
          onClick={existing ? undefined : cancel}
        >
          <XMarkIcon aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </NextLink>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={title({ size: "sm", className: "text-xl" })}>
            {heading}
          </span>
          <span className="truncate text-[13px] text-muted">
            {[
              statusWord,
              group.name,
              existing && numbered !== null
                ? t("stepCount", { current: numbered, total: TOTAL_STEPS })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        {existing ? (
          <SaveStatus
            state={save}
            submitted={submitted}
            variant="chip"
            onRetry={() => autosave.engine.retry()}
          />
        ) : (
          numbered !== null && (
            <span className="pr-2 text-sm font-semibold text-muted tabular-nums">
              {t("stepCount", { current: numbered, total: TOTAL_STEPS })}
            </span>
          )
        )}
      </header>

      <div className="hidden md:block">
        <StaffAppPageHeader
          actions={
            numbered === null || step === "meeting" ? undefined : (
              <ReportStepper current={numbered} />
            )
          }
          breadcrumbAside={
            existing ? (
              <SaveStatus
                state={save}
                submitted={submitted}
                variant="pill"
                onRetry={() => autosave.engine.retry()}
              />
            ) : undefined
          }
          breadcrumbs={breadcrumbs}
          eyebrow={group.name}
          title={heading}
          titleAside={
            existing ? <ReportStatusPill submitted={submitted} /> : undefined
          }
        />
      </div>

      {banner && <div className="mb-5">{banner}</div>}

      {step === "meeting" && (
        <MeetingStep
          address={draft.address}
          canChoose={
            ready !== null &&
            exists === null &&
            !hiddenDraft &&
            !noPeople &&
            (noMeetingOnDate === null || replacing)
          }
          canSaveNoMeeting={
            ready !== null &&
            exists === null &&
            !hiddenDraft &&
            noMeetingOnDate === null
          }
          date={date}
          dateProblem={dateProblem}
          filedDates={filedDates}
          group={group}
          groups={groups}
          met={draft.met}
          mode={mode}
          noMeetingDates={noMeetingDates}
          noMeetingOnDate={noMeetingOnDate}
          noPeople={noPeople}
          reason={draft.reason}
          rosterLoading={roster.status === "loading"}
          saveError={!draft.met && blocking ? blocking.message : null}
          saving={isSubmitting}
          scoped={scoped}
          today={today}
          onAddressChange={(address) => edit({ address }, "text")}
          onCancel={cancel}
          onChooseMode={chooseMode}
          onDateChange={changeDate}
          onGroupChange={changeGroup}
          onMetChange={(met) => {
            setFailure(null);
            edit({ met });
          }}
          onReasonChange={(reason) => edit({ reason }, "text")}
          onReplace={() => edit({ replacing: true })}
          onSaveNoMeeting={saveNoMeeting}
          onUndoReplace={() => edit({ replacing: false })}
        />
      )}

      {step === "people" && ready && person && (
        <PersonStep
          answer={draft.answers[personKey(person.person)]}
          guests={guestActions.controls}
          index={personIndex}
          meetingDate={date}
          person={person}
          sundayLabel={sundayLabel}
          total={people.length}
          onBack={() =>
            personIndex === 0
              ? setStep("meeting")
              : setPersonIndex(personIndex - 1)
          }
          onChange={(patch) => answer(personKey(person.person), patch)}
          onNext={() => {
            if (personIndex === people.length - 1) {
              setReviewFrom("group");
              setStep("group");
            } else {
              setPersonIndex(personIndex + 1);
            }
          }}
          onSkip={() => {
            setReviewFrom("people");
            setStep("review");
          }}
        />
      )}

      {step === "group" && (
        <GroupStep
          items={draft.items}
          tagContext={tagContext}
          onBack={() => setStep("people")}
          onChange={changeItems}
          onNext={() => {
            setReviewFrom("group");
            setStep("review");
          }}
        />
      )}

      {(step === "review" || step === "quick" || step === "list") &&
        (ready || (existing && roster.status === "loading")) && (
          <div className="flex flex-col gap-4">
            {step === "review" && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-tile border border-border bg-surface px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-semibold text-heading">
                  <CalendarDaysIcon
                    aria-hidden="true"
                    className="size-[18px]"
                  />
                  {formatCalendarFullDate(date, locale)}
                </span>
                {draft.address && (
                  <span className="min-w-0 basis-full text-muted md:flex-1 md:basis-0 md:truncate">
                    {draft.address}
                  </span>
                )}
                <Button
                  className="ml-auto font-semibold"
                  size="sm"
                  variant="outline"
                  onPress={() => setStep("meeting")}
                >
                  {t("change")}
                </Button>
              </div>
            )}
            {step === "list" && existing && (
              <section
                aria-label={t("meetingDetails")}
                className={card({ className: "p-5" })}
              >
                <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                  <div className="flex flex-col gap-1.5">
                    <MeetingDatePicker
                      describedBy="meeting-date-problem"
                      filedDates={filedDates}
                      isInvalid={dateProblem !== null}
                      meetingDay={existing.roster.smallGroup.meetingDay}
                      noMeetingDates={noMeetingDates}
                      today={today}
                      value={date}
                      onChange={changeDate}
                    />
                    <DateProblemNote problem={dateProblem} />
                  </div>
                  <TextField
                    className="gap-1.5"
                    maxLength={ADDRESS_MAX}
                    name="address"
                    value={draft.address}
                    onChange={(address) => edit({ address }, "text")}
                  >
                    <Label className="text-[13px] font-semibold text-heading">
                      {t("address")}
                    </Label>
                    <InputGroup className="h-10 w-full rounded-control">
                      <InputGroup.Input className="text-sm sm:text-sm" />
                    </InputGroup>
                    <Description className="text-[13px] text-muted">
                      {t("addressHint")}
                    </Description>
                  </TextField>
                </div>
                {existing.meta && (
                  <p className="mt-4 text-[13px] text-muted">{existing.meta}</p>
                )}
              </section>
            )}
            <ReportListStep
              answers={draft.answers}
              audience={audience}
              footer={listFooter}
              guests={guestActions.controls}
              items={draft.items}
              meetingDate={date}
              observationsVisible={observationsVisible}
              people={people}
              shortSundayLabel={shortSundayLabel}
              showOpen={step !== "review"}
              tagContext={tagContext}
              tintUnanswered={step !== "quick"}
              onAnswer={answer}
              onItems={changeItems}
            />
          </div>
        )}

      {guestActions.dialogs}
    </div>
  );
}
