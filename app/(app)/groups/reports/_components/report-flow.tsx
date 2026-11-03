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
import type { ResumeInfo } from "@/app/(app)/groups/reports/_components/resume-card";
import type { ChangeKind } from "@/app/(app)/groups/reports/_lib/report-autosave";
import type {
  ReportDraft,
  ReportDraftAnswer,
} from "@/app/(app)/groups/reports/_lib/report-draft";
import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  PaperAirplaneIcon,
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
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { DateProblemNote } from "./date-problem-note";
import { GroupStep } from "./group-step";
import { MeetingDatePicker } from "./meeting-date-picker";
import { MeetingStep } from "./meeting-step";
import { PersonStep } from "./person-step";
import { ReportBanner } from "./report-banner";
import { ReportConfirmDialog } from "./report-confirm-dialog";
import { ReportFooterStatus } from "./report-footer-status";
import { useReportGuests } from "./report-guests";
import { isMarked, ReportListStep } from "./report-list-step";
import { ReportStepper } from "./report-stepper";
import { ResumeCard } from "./resume-card";
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
import { defaultMeetingDate } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { guestsFirst, personKey } from "@/app/(app)/groups/reports/_lib/person";
import { emptyDraftItems } from "@/app/(app)/groups/reports/_lib/report-items-draft";
import { tagContextOf } from "@/app/(app)/groups/reports/_lib/report-tags";
import {
  addedPeople,
  firstOpenIndex,
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
  formatCalendarWeekdayDate,
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

/** `list`: a report opened from the server, on its full list (with the resume card for a draft). */
type Step = "meeting" | "people" | "group" | "review" | "quick" | "list";

/** A report the editor opens: a draft or a submitted one, and the roster for its date. */
export interface ExistingReport {
  report: ReportDetail;
  roster: ReportRoster;
  /** "Submitted by … · Last edited by …"; null for a draft. */
  meta: string | null;
  /** A draft's resume card; null for a submitted report. */
  resume: ResumeInfo | null;
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
 * The one report editor (auto-save). A new report: the meeting, one person at a time, the group,
 * then the full list to review and submit; its first change after the group and date are chosen
 * creates the draft, and the address becomes the draft's (`/edit`) without leaving the screen.
 * A saved report (`existing`, a draft or a submitted one) opens on its full list. Every change
 * saves as it is made: the save status says where the latest change is, and there is no Save.
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
  memberId,
}: {
  groups: FlowGroup[];
  scoped: boolean;
  today: string;
  initialGroupId: number;
  initialDate: string;
  initialDates: ReportedDates;
  initialRoster: Extract<RosterState, { status: "ready" }> | null;
  existing?: ExistingReport;
  /** The viewer's member, left out of "who else sees this draft". */
  memberId: number | null;
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
  // The latest draft, roster, group and date, readable between renders: two quick taps must not
  // overwrite each other, and a save built after a roster reload must use the new roster.
  const draftRef = useRef(draft);
  const rosterRef = useRef<ReportRoster | null>(
    existing?.roster ?? initialRoster?.roster ?? null,
  );
  const dateRef = useRef(date);
  const groupRef = useRef(groupId);
  // The report's id once it exists: from the server, or after a new report's first save.
  const [savedId, setSavedId] = useState(existing?.report.id ?? null);
  const savedIdRef = useRef(savedId);
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
  const [dialog, setDialog] = useState<
    "submit" | "discard" | "noMeeting" | null
  >(null);
  // *Continue one at a time* started here: the "Picking up where you left off" banner.
  const [resumedAt, setResumedAt] = useState<number | null>(null);
  // The group and date the roster below belongs to, so the first render doesn't ask again.
  const loadedFor = useRef<string | null>(
    initialRoster || existing ? `${initialGroupId}:${initialDate}` : null,
  );
  const submitted = existing?.report.status === "submitted";
  const observationsVisible = existing?.report.observationsVisible ?? true;
  // A draft opened from the server: its list is the review, and the mode isn't asked again.
  const resumedDraft = existing !== undefined && !submitted;
  const listStep: Step = existing ? "list" : "review";

  function readyRoster(next: ReportRoster) {
    rosterRef.current = next;
    setRoster((current) => ({
      status: "ready",
      roster: next,
      existsMessage:
        current.status === "ready" &&
        current.roster.meetingDate === next.meetingDate
          ? current.existsMessage
          : null,
      noMeetingReason:
        current.status === "ready" ? current.noMeetingReason : null,
    }));
  }

  /** The roster for the date again, after a 422 `attendance`: rebuild the report on it. */
  async function rosterForSave() {
    const before = rosterRef.current;
    const result = await getReportRosterAction(
      groupRef.current,
      dateRef.current,
    );

    if (!result.ok) return null;

    rosterRef.current = result.roster;
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
    reportId: existing?.report.id ?? null,
    version: existing?.report.version ?? 0,
    savedAt: existing
      ? (existing.report.lastEditedAt ??
        existing.report.submittedAt ??
        existing.report.startedAt)
      : null,
    newTarget: { groupId: initialGroupId, date: initialDate },
    save: saveReportAction,
    // The draft's first save; the date's no meeting goes in the same transaction when replacing.
    create: (body) =>
      createReportAction(groupRef.current, {
        ...body,
        ...(draftRef.current.replacing && { replacesNoMeeting: true }),
      }),
    onCreated: (id) => {
      savedIdRef.current = id;
      setSavedId(id);
      // A reload from here resumes the draft. Not a navigation: the leader stays on their step.
      window.history.replaceState(null, "", `/groups/reports/${id}/edit`);
    },
    canSend: (body) => !submitted || isComplete(body),
    onRosterChanged: rosterForSave,
    onFailure: setFailure,
  });

  /**
   * Whether a new report may become a draft now (rule 6: the first change after group and date):
   * the group met, someone is on the list, and nothing else holds the date.
   */
  function canStartDraft(current: ReportRoster): boolean {
    const held = current.existingReport;

    if (!draftRef.current.met || current.people.length === 0) return false;

    if (held === null) return true;

    // Someone else's draft, a report, or a no meeting the leader hasn't chosen to replace.
    return !isHiddenDraft(held) && !held.held && draftRef.current.replacing;
  }

  /** Saves the report as it is now. A new one waits for its roster and a date it can take. */
  function pushChange(kind: ChangeKind) {
    const current = rosterRef.current;

    if (!current) return;

    if (savedIdRef.current === null && !canStartDraft(current)) return;

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

  // Opening a saved report. A change this device made that the server doesn't have yet (the
  // connection dropped, the tab closed) is restored and sent; one based on an older version is a
  // conflict (rule 9). Without one, a draft whose rows no longer match the roster for its date
  // (someone joined or left with an earlier date) gets the new list and a notice (rule 11).
  useEffect(() => {
    if (!existing) return;

    const { report } = existing;
    const saved = loadOutbox<ReportDraft>({ reportId: report.id });
    const serverBody = toReportBody(
      formFromReport(report),
      existing.roster,
      report.meetingDate,
      report.observationsVisible,
    ).body;

    if (saved && JSON.stringify(saved.body) !== JSON.stringify(serverBody)) {
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

      autosave.engine.markConflict({
        version: report.version,
        lastEditedBy: report.lastEditedBy,
        lastEditedAt: report.lastEditedAt,
      });

      return;
    }

    // The server already has it (the response was lost on the way back).
    if (saved) clearOutbox({ reportId: report.id });

    const onReport = new Set(
      report.attendances.map((row) => personKey(row.person)),
    );
    const onRoster = existing.roster.people.map((row) => personKey(row.person));

    if (
      onRoster.length !== onReport.size ||
      onRoster.some((key) => !onReport.has(key))
    ) {
      setRosterChange(
        existing.roster.people
          .filter((row) => !onReport.has(personKey(row.person)))
          .map((row) => row.name),
      );
      pushChange("blur");
    }
    // Runs once: the engine and the report don't change while the editor is open.
  }, []);

  // Every group or date change: ask who belongs on the report. A new report starts over on the
  // meeting step, and opens the leader's own draft when the date has one (rule 2); a saved report
  // sends its new date once that date's roster is in.
  useEffect(() => {
    const key = `${groupId}:${date}`;

    dateRef.current = date;
    groupRef.current = groupId;
    autosave.engine.retarget({ groupId, date });

    if (draftRef.current.replacing) {
      // "Replace the no-meeting mark" belongs to one date; the next one starts with its own prompt.
      draftRef.current = { ...draftRef.current, replacing: false };
      setDraft(draftRef.current);
    }

    if (loadedFor.current === key) return;

    let cancelled = false;

    loadedFor.current = key;
    rosterRef.current = null;
    setRoster({ status: "loading" });
    setFailure(null);

    if (savedIdRef.current === null) {
      setMode(null);
      setStep("meeting");
    }

    void getReportRosterAction(groupId, date).then((result) => {
      if (cancelled) return;

      if (!result.ok) {
        setRoster({ status: "error", message: result.message });

        return;
      }

      const held = result.roster.existingReport;

      // The leader's own draft for this date: continue it rather than start another (rule 2).
      if (
        savedIdRef.current === null &&
        held &&
        !isHiddenDraft(held) &&
        held.status === "draft"
      ) {
        router.push(`/groups/reports/${held.id}/edit`);

        return;
      }

      rosterRef.current = result.roster;
      setRoster({
        status: "ready",
        roster: result.roster,
        existsMessage: result.existsMessage,
        noMeetingReason: result.noMeetingReason,
      });

      if (savedIdRef.current !== null) pushChange("tap");
    });

    return () => {
      cancelled = true;
      loadedFor.current = null;
    };
    // pushChange, router and the engine read refs or never change while the editor is open.
  }, [groupId, date]);

  // A new step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  function edit(patch: Partial<ReportDraft>, kind: ChangeKind = "tap") {
    draftRef.current = { ...draftRef.current, ...patch };
    setDraft(draftRef.current);
    pushChange(kind);
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
    if (nextId === groupId || savedId !== null) return;

    const next = groups.find((option) => option.id === nextId);

    if (!next) return;

    // The new group's filed dates decide its starting date, so switch group and date together.
    void listReportedDatesAction(nextId, today).then((dates) => {
      const filed = new Set(dates.filed);
      const noMeeting = new Set(dates.noMeeting);

      setFiledDates(filed);
      setNoMeetingDates(noMeeting);
      draftRef.current = emptyDraft(next.meetingAddress ?? "");
      setDraft(draftRef.current);
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

    if (roster.status !== "ready") return;

    // Choosing how to take attendance is the first change: the draft starts here.
    pushChange("tap");

    if (next === "quick") setStep("quick");

    if (next === "guided") {
      const firstOpen = firstOpenIndex(
        guestsFirst(roster.roster.people),
        draftRef.current.answers,
      );

      setPersonIndex(firstOpen === -1 ? 0 : firstOpen);
      setStep("people");
    }
  }

  /** Done, Back to My reports: send what's pending, refresh the lists, then go. */
  function leave(href: string) {
    const id = savedIdRef.current;

    startLeaving(async () => {
      if (id !== null) {
        await autosave.engine.flush();
        await leaveReportAction(id, groupRef.current);
      }

      router.push(href);
    });
  }

  /** Submit the draft (rule 5): the pending save goes first, and submit uses its version. */
  function submitDraft() {
    const id = savedIdRef.current;

    if (id === null) return;

    setFailure(null);
    startSubmit(async () => {
      const version = await autosave.engine.flush();

      // The save status and banner say why it didn't save.
      if (version === null) {
        setDialog(null);

        return;
      }

      const result = await submitReportAction(id, groupRef.current, version);

      // Success redirects to the report; anything else is shown on the editor.
      setDialog(null);

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
    const id = savedIdRef.current;

    if (id === null) return;

    autosave.engine.dispose();
    clearOutbox({ reportId: id });
    startSubmit(async () => {
      const result = await deleteReportAction(id, groupRef.current, {
        draft: true,
      });

      setDialog(null);
      setFailure(result);
    });
  }

  /** Save the no meeting; on a date with the leader's draft, ask first (rule 18). */
  function saveNoMeeting() {
    if (savedIdRef.current !== null) {
      setDialog("noMeeting");

      return;
    }

    markDateNoMeeting();
  }

  function markDateNoMeeting() {
    const id = savedIdRef.current;

    setFailure(null);
    startSubmit(async () => {
      // The leader's draft for the date goes in the same transaction (rule 18).
      if (id !== null) autosave.engine.dispose();

      const result = await markNoMeeting(groupId, date, draft.reason, {
        replacesDraft: id !== null,
      });

      if (result.ok) {
        if (id !== null) clearOutbox({ reportId: id });

        router.push("/groups/reports?saved=marked");

        return;
      }

      setDialog(null);
      setFailure(result);
    });
  }

  function reloadPeople() {
    setReloading(true);
    void getReportRosterAction(groupId, date).then((result) => {
      setReloading(false);

      if (!result.ok) return;

      // Answers stay keyed by member, so people still on the roster keep theirs.
      readyRoster(result.roster);
      setFailure(null);
      pushChange("tap");
    });
  }

  // The roster for the chosen group and date, replacing the one shown; null when it can't be read.
  // A saved report saves on it at once: a guest added or removed changes who is on the report.
  async function refreshRoster(): Promise<ReportRoster | null> {
    const result = await getReportRosterAction(groupId, date);

    if (!result.ok) return null;

    readyRoster(result.roster);

    if (savedIdRef.current !== null) pushChange("tap");

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
    existingOnDate.id !== savedId
      ? existingOnDate
      : null;
  // A no meeting on the date can be replaced by a new report; a held report there is a duplicate.
  const noMeetingId =
    visible && !visible.held && savedId === null ? visible.id : null;
  const exists =
    visible && (visible.held || savedId !== null) ? visible.id : null;
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
  const firstOpen = firstOpenIndex(people, draft.answers);
  const cameCount = people.filter(
    (row) => draft.answers[personKey(row.person)]?.attendedGroup === true,
  ).length;
  const noteCount = people.filter((row) =>
    draft.answers[personKey(row.person)]?.observation.trim(),
  ).length;
  // Who else sees the draft and loses it with a discard: the group's leaders and co-leaders on
  // the list, and whoever started it (rule 14), but not the viewer.
  const draftViewers = new Map<number, string>();

  for (const row of people) {
    if (row.person.type === "member" && row.role !== "member") {
      draftViewers.set(row.person.id, row.name.split(" ")[0]);
    }
  }

  if (existing) {
    draftViewers.set(
      existing.report.startedBy.memberId,
      existing.report.startedBy.name.split(" ")[0],
    );
  }

  if (memberId !== null) draftViewers.delete(memberId);

  const others = new Intl.ListFormat(locale, { type: "conjunction" }).format([
    ...draftViewers.values(),
  ]);
  const weekdayDate = formatCalendarWeekdayDate(date, locale);
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
  // The quick list has no number, and neither has saving a no meeting from step 1 or a saved list.
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
  // The save status shows once the report exists (or its first save is on its way).
  const showSave =
    savedId !== null || save.status !== "saved" || save.savedAt !== null;
  // The pill is hidden on a new report's meeting step (`AutoSave` boards).
  const showPill = savedId !== null || step !== "meeting";
  const statusWord = showPill
    ? submitted
      ? t("submittedPill")
      : t("draftPill")
    : null;
  const flowGroups = savedId === null ? groups : [group];
  const toList = "/groups/reports";
  const closeHref = submitted ? `/groups/reports/${savedId}` : toList;
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
    ) : rosterChange !== null &&
      (step === "list" || step === "quick" || step === "review") ? (
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
    ) : step === "people" && resumedAt === personIndex && person ? (
      <ReportBanner
        body={t("resumedBody", { name: person.name })}
        icon={InformationCircleIcon}
        title={t("resumedTitle")}
        tone="accent"
      />
    ) : null;
  const breadcrumbs =
    submitted && existing
      ? [
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          {
            label: `${group.name}, ${formatCalendarShortDate(existing.report.meetingDate, locale)}`,
            href: `/groups/reports/${savedId}`,
          },
          { label: heading, href: `/groups/reports/${savedId}/edit` },
        ]
      : [
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          {
            label: heading,
            href:
              savedId === null
                ? "/groups/reports/new"
                : `/groups/reports/${savedId}/edit`,
          },
        ];
  // Back from the new flow's review or quick list; a reopened report's list has nowhere to go back.
  const backButton =
    step === "review" || step === "quick" ? (
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
        <ArrowLeftIcon aria-hidden="true" className="size-4" strokeWidth={2} />
        {t("back")}
      </Button>
    ) : null;
  const listFooter = (
    <>
      {savedId !== null && !submitted && (
        <Button
          className="gap-1.5 px-3 font-semibold text-danger"
          isDisabled={isSubmitting}
          variant="ghost"
          onPress={() => setDialog("discard")}
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
        {backButton}
        {submitted ? (
          <Button
            className="flex-1 gap-2 font-semibold sm:flex-none"
            isPending={isLeaving}
            onPress={() => leave(`/groups/reports/${savedId}`)}
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
            isDisabled={
              remaining > 0 ||
              noPeople ||
              savedId === null ||
              save.status === "conflict"
            }
            isPending={isSubmitting && dialog === null}
            onPress={() => setDialog("submit")}
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
        <button
          aria-label={t("close")}
          className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted outline-none hover:bg-surface-secondary focus-visible:shadow-[var(--shadow-focus)]"
          type="button"
          onClick={() => leave(closeHref)}
        >
          <XMarkIcon aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={title({ size: "sm", className: "text-xl" })}>
            {heading}
          </span>
          <span className="truncate text-[13px] text-muted">
            {[
              statusWord,
              group.name,
              showSave && numbered !== null
                ? t("stepCount", { current: numbered, total: TOTAL_STEPS })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        {showSave ? (
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
            showSave ? (
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
            showPill ? <ReportStatusPill submitted={submitted} /> : undefined
          }
        />
      </div>

      {banner && (
        <div
          className={
            step === "people"
              ? "mb-5 max-w-[600px]"
              : step === "group"
                ? "mb-5 max-w-[720px]"
                : "mb-5"
          }
        >
          {banner}
        </div>
      )}

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
          groups={flowGroups}
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
          onBackToList={resumedDraft ? () => setStep("list") : undefined}
          onCancel={() => leave(toList)}
          onChooseMode={chooseMode}
          onDateChange={changeDate}
          onGroupChange={changeGroup}
          onMetChange={(met) => {
            setFailure(null);
            // Not a draft change: a no meeting is never a draft (rule 1).
            draftRef.current = { ...draftRef.current, met };
            setDraft(draftRef.current);
          }}
          onReasonChange={(reason) => {
            draftRef.current = { ...draftRef.current, reason };
            setDraft(draftRef.current);
          }}
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
              ? setStep(resumedDraft ? "list" : "meeting")
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
            setStep(listStep);
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
            setStep(listStep);
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
            {step === "list" && resumedDraft && existing.resume && (
              <ResumeCard
                address={draft.address}
                answered={markedCount}
                date={date}
                done={people.map((row) =>
                  isMarked(draft.answers[personKey(row.person)]),
                )}
                firstOpenName={firstOpen === -1 ? null : people[firstOpen].name}
                info={existing.resume}
                onChangeMeeting={() => setStep("meeting")}
                onContinue={() => {
                  const start = firstOpen === -1 ? 0 : firstOpen;

                  setPersonIndex(start);
                  setResumedAt(firstOpen === -1 ? null : start);
                  setStep("people");
                }}
              />
            )}
            {step === "list" && submitted && existing && (
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

      <ReportConfirmDialog
        body={t("submitBody")}
        cancelLabel={t("keepEditing")}
        confirmLabel={t("submit")}
        icon={PaperAirplaneIcon}
        isOpen={dialog === "submit"}
        isPending={isSubmitting}
        summary={[
          {
            value: `${markedCount} / ${people.length}`,
            label: t("sumAnswered"),
          },
          { value: String(cameCount), label: t("sumCame") },
          { value: String(noteCount), label: t("sumNotes") },
        ]}
        title={t("submitTitle")}
        tone="accent"
        onConfirm={submitDraft}
        onOpenChange={(open) => setDialog(open ? "submit" : null)}
      />
      <ReportConfirmDialog
        body={
          draftViewers.size > 0
            ? t("discardBody", {
                date: weekdayDate,
                answered: markedCount,
                total: people.length,
                notes: noteCount,
                others,
                count: draftViewers.size,
              })
            : t("discardBodyAlone", {
                date: weekdayDate,
                answered: markedCount,
                total: people.length,
                notes: noteCount,
              })
        }
        cancelLabel={t("keepDraft")}
        confirmLabel={t("discard")}
        icon={TrashIcon}
        isOpen={dialog === "discard"}
        isPending={isSubmitting}
        title={t("discardTitle")}
        tone="danger"
        onConfirm={discardDraft}
        onOpenChange={(open) => setDialog(open ? "discard" : null)}
      />
      <ReportConfirmDialog
        body={t("nmDraftBody", {
          date: weekdayDate,
          answered: markedCount,
          total: people.length,
        })}
        cancelLabel={t("nmKeep")}
        confirmLabel={t("nmConfirm")}
        icon={TrashIcon}
        isOpen={dialog === "noMeeting"}
        isPending={isSubmitting}
        title={t("nmDraftTitle")}
        tone="danger"
        onConfirm={markDateNoMeeting}
        onOpenChange={(open) => setDialog(open ? "noMeeting" : null)}
      />
    </div>
  );
}
