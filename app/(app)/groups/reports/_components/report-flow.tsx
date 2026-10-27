"use client";

import type { ReportRoster } from "@/api/small-groups-api/types";
import type { ReportFailure } from "@/app/(app)/groups/reports/_actions/report-actions";
import type { DateProblem } from "@/app/(app)/groups/reports/_components/date-problem-note";
import type {
  AttendanceMode,
  FlowGroup,
  NoMeetingOnDate,
} from "@/app/(app)/groups/reports/_components/meeting-step";
import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { GroupStep } from "./group-step";
import { MeetingStep } from "./meeting-step";
import { PersonStep } from "./person-step";
import { ReportFooterStatus } from "./report-footer-status";
import { useReportGuests } from "./report-guests";
import { isMarked, ReportListStep } from "./report-list-step";
import { ReportStepper } from "./report-stepper";

import {
  createReportAction,
  getReportRosterAction,
  listReportedDatesAction,
  markNoMeeting,
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
import { title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import {
  formatCalendarFullDate,
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

type Step = "meeting" | "people" | "group" | "review" | "quick";

const TOTAL_STEPS = 4;
// The quick list has no steps: it is one screen, so no stepper and no "n / 4".
const STEP_NUMBER = { meeting: 1, people: 2, group: 3, review: 4 } as const;
/** Failures that belong on the date field: the leader has to pick another date. */
const DATE_FAILURES: readonly (string | undefined)[] = [
  "exists",
  "future",
  "notLeaderOnDate",
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

/**
 * The whole new-report flow: it holds the group, date, answers and texts, asks the API who
 * belongs on the report for that date, and keeps an unsent draft in the browser. Steps: the
 * meeting, one person at a time, the group, then the full list to review and submit.
 */
export function ReportFlow({
  groups,
  scoped,
  today,
  initialGroupId,
  initialDate,
  initialDates,
  initialRoster,
}: {
  groups: FlowGroup[];
  scoped: boolean;
  today: string;
  initialGroupId: number;
  initialDate: string;
  initialDates: ReportedDates;
  initialRoster: Extract<RosterState, { status: "ready" }> | null;
}) {
  const t = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [isSubmitting, startSubmit] = useTransition();
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
    initialRoster ?? { status: "loading" },
  );
  const group = groups.find((option) => option.id === groupId) ?? groups[0];
  const [draft, setDraft] = useState(() =>
    emptyDraft(group.meetingAddress ?? ""),
  );
  // The latest draft, readable between renders: two quick taps must not overwrite each other.
  const draftRef = useRef(draft);
  const [mode, setMode] = useState<AttendanceMode | null>(null);
  const [step, setStep] = useState<Step>("meeting");
  const [personIndex, setPersonIndex] = useState(0);
  // Where Back from the review goes: the group step, or the person left when skipping to the list.
  const [reviewFrom, setReviewFrom] = useState<"group" | "people" | "meeting">(
    "group",
  );
  const [failure, setFailure] = useState<ReportFailure | null>(null);
  const [reloading, setReloading] = useState(false);
  // The group and date the roster below belongs to, so the first render doesn't ask again.
  const loadedFor = useRef<string | null>(
    initialRoster ? `${initialGroupId}:${initialDate}` : null,
  );
  const previousGroup = useRef(initialGroupId);

  // Every group or date change: restore a draft for that pair, then ask who belongs on the report.
  useEffect(() => {
    const key = `${groupId}:${date}`;
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

    previousGroup.current = groupId;

    if (loadedFor.current === key) return;

    let cancelled = false;

    loadedFor.current = key;
    setRoster({ status: "loading" });
    setMode(null);
    setStep("meeting");
    setFailure(null);

    void getReportRosterAction(groupId, date).then((result) => {
      if (cancelled) return;

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
    });

    return () => {
      cancelled = true;
      loadedFor.current = null;
    };
  }, [groupId, date, group.meetingAddress]);

  // A new step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  function edit(patch: Partial<ReportDraft>) {
    const next = { ...draftRef.current, ...patch };

    draftRef.current = next;
    setDraft(next);
    saveDraft(groupId, date, next);
  }

  function answer(key: string, patch: Partial<ReportDraftAnswer>) {
    const { answers } = draftRef.current;

    edit({
      answers: {
        ...answers,
        [key]: { ...(answers[key] ?? NO_ANSWER), ...patch },
      },
    });
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

  function submit() {
    if (roster.status !== "ready") return;

    const body = toReportInput(draft, roster.roster, date, true);

    if (!body) return;

    // Only while the date still holds the mark does the API get asked to replace it.
    const input = replacing ? { ...body, replacesNoMeeting: true } : body;

    setFailure(null);
    // A successful submit redirects and never comes back, so the draft goes first and returns on failure.
    clearDraft(groupId, date);
    startSubmit(async () => {
      const result = await createReportAction(groupId, input);

      saveDraft(groupId, date, draftRef.current);
      setFailure(result);

      // A date problem is fixed on the meeting step; anything else stays on the review.
      if (DATE_FAILURES.includes(result.kind)) setStep("meeting");
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
  async function refreshRoster(): Promise<ReportRoster | null> {
    const result = await getReportRosterAction(groupId, date);

    if (!result.ok) return null;

    setRoster({
      status: "ready",
      roster: result.roster,
      existsMessage: result.existsMessage,
      noMeetingReason: result.noMeetingReason,
    });

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
  const existingId = ready?.roster.existingReportId ?? null;
  // A no meeting on the date can be replaced by a report; a held report there is a duplicate.
  const noMeetingId =
    ready?.roster.existingReportHeld === false ? existingId : null;
  const exists = noMeetingId === null ? existingId : null;
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
      ? { message: ready.existsMessage ?? "", existingReportId: exists }
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
  const heading = step === "review" ? t("reviewTitle") : t("newTitle");
  // The quick list has no number, and neither has saving a no meeting from step 1.
  const numbered =
    step === "quick" || (step === "meeting" && !draft.met && !noMeetingOnDate)
      ? null
      : STEP_NUMBER[step];
  const person = people[personIndex];
  const blocking =
    failure !== null && !DATE_FAILURES.includes(failure.kind) ? failure : null;

  return (
    <>
      {/* Phone: a focused task header replaces the top bar. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-1 border-b border-border bg-background px-2 md:hidden">
        <NextLink
          aria-label={t("close")}
          className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary"
          href="/groups/reports"
          onClick={cancel}
        >
          <XMarkIcon aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </NextLink>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={title({ size: "sm", className: "text-xl" })}>
            {heading}
          </span>
          <span className="truncate text-[13px] text-muted">{group.name}</span>
        </div>
        {numbered !== null && (
          <span className="pr-2 text-sm font-semibold text-muted tabular-nums">
            {t("stepCount", { current: numbered, total: TOTAL_STEPS })}
          </span>
        )}
      </header>

      <div className="hidden md:block">
        <StaffAppPageHeader
          actions={
            numbered === null || step === "meeting" ? undefined : (
              <ReportStepper current={numbered} />
            )
          }
          breadcrumbs={[
            groupsBreadcrumb,
            groupsReportsBreadcrumb,
            { label: heading, href: "/groups/reports/new" },
          ]}
          eyebrow={group.name}
          title={heading}
        />
      </div>

      {step === "meeting" && (
        <MeetingStep
          address={draft.address}
          canChoose={
            ready !== null &&
            exists === null &&
            !noPeople &&
            (noMeetingOnDate === null || replacing)
          }
          canSaveNoMeeting={
            ready !== null && exists === null && noMeetingOnDate === null
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
          onAddressChange={(address) => edit({ address })}
          onCancel={cancel}
          onChooseMode={chooseMode}
          onDateChange={changeDate}
          onGroupChange={changeGroup}
          onMetChange={(met) => {
            setFailure(null);
            edit({ met });
          }}
          onReasonChange={(reason) => edit({ reason })}
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
          onChange={(section, next) =>
            edit({ items: { ...draftRef.current.items, [section]: next } })
          }
          onNext={() => {
            setReviewFrom("group");
            setStep("review");
          }}
        />
      )}

      {(step === "review" || step === "quick") && ready && (
        <div className="flex flex-col gap-4">
          {step === "review" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-tile border border-border bg-surface px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-heading">
                <CalendarDaysIcon aria-hidden="true" className="size-[18px]" />
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
          <ReportListStep
            observationsVisible
            answers={draft.answers}
            audience={audience}
            footer={
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
                    onPress={submit}
                  >
                    <CheckIcon
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={2.2}
                    />
                    {t("submit")}
                  </Button>
                </div>
              </>
            }
            guests={guestActions.controls}
            items={draft.items}
            meetingDate={date}
            people={people}
            shortSundayLabel={shortSundayLabel}
            tagContext={tagContext}
            tintUnanswered={step === "review"}
            onAnswer={answer}
            onItems={(section, next) =>
              edit({ items: { ...draftRef.current.items, [section]: next } })
            }
          />
        </div>
      )}

      {guestActions.dialogs}
    </>
  );
}
