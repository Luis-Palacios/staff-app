"use client";

import type { ReportInput, ReportRoster } from "@/api/small-groups-api/types";
import type { ReportFailure } from "@/app/(app)/groups/reports/_actions/report-actions";
import type { GroupTextField } from "@/app/(app)/groups/reports/_components/group-fields";
import type {
  AttendanceMode,
  DateProblem,
  FlowGroup,
} from "@/app/(app)/groups/reports/_components/meeting-step";
import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { GroupStep } from "./group-step";
import { MeetingStep } from "./meeting-step";
import { PersonStep } from "./person-step";
import { isMarked, ReportListStep } from "./report-list-step";
import { ReportStepper } from "./report-stepper";

import {
  createReportAction,
  getReportRosterAction,
  listFiledDatesAction,
} from "@/app/(app)/groups/reports/_actions/report-actions";
import { formatChurchSunday } from "@/app/(app)/groups/reports/_lib/format-church-sunday";
import { defaultMeetingDate } from "@/app/(app)/groups/reports/_lib/meeting-dates";
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
  | { status: "ready"; roster: ReportRoster; existsMessage: string | null }
  | { status: "error"; message: string };

type Step = "meeting" | "people" | "group" | "review";

const TOTAL_STEPS = 4;
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
  return { address, prayer: "", praise: "", discussion: "", answers: {} };
}

/** The API body for a complete draft, people in roster order; null while anyone is unanswered. */
function toInput(
  draft: ReportDraft,
  roster: ReportRoster,
  date: string,
): ReportInput | null {
  const attendances: ReportInput["attendances"] = [];

  for (const person of roster.people) {
    const answer = draft.answers[person.memberId];

    if (
      !answer ||
      answer.attendedGroup === null ||
      answer.attendedChurch === null
    ) {
      return null;
    }

    attendances.push({
      memberId: person.memberId,
      attendedGroup: answer.attendedGroup,
      attendedChurch: answer.attendedChurch,
      observation: answer.observation.trim() || null,
    });
  }

  return {
    meetingDate: date,
    address: draft.address.trim() || null,
    groupPrayerRequest: draft.prayer.trim() || null,
    groupPraiseReport: draft.praise.trim() || null,
    groupRelevantDiscussion: draft.discussion.trim() || null,
    attendances,
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
  initialFiledDates,
  initialRoster,
}: {
  groups: FlowGroup[];
  scoped: boolean;
  today: string;
  initialGroupId: number;
  initialDate: string;
  initialFiledDates: string[];
  initialRoster: Extract<RosterState, { status: "ready" }> | null;
}) {
  const t = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [isSubmitting, startSubmit] = useTransition();
  const [groupId, setGroupId] = useState(initialGroupId);
  const [date, setDate] = useState(initialDate);
  const [filedDates, setFiledDates] = useState(
    () => new Set(initialFiledDates),
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
  const [reviewFrom, setReviewFrom] = useState<"group" | "people">("group");
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

  function answer(memberId: number, patch: Partial<ReportDraftAnswer>) {
    const key = String(memberId);
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
    void listFiledDatesAction(nextId, today).then((dates) => {
      const filed = new Set(dates);

      setFiledDates(filed);
      setGroupId(nextId);
      setDate(
        defaultMeetingDate({
          today,
          meetingDay: next.meetingDay,
          filedDates: filed,
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

    if (next === "guided" && roster.status === "ready") {
      const firstOpen = roster.roster.people.findIndex(
        (person) => !isMarked(draft.answers[person.memberId]),
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

    const input = toInput(draft, roster.roster, date);

    if (!input) return;

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
      });
      setFailure(null);
    });
  }

  const ready = roster.status === "ready" ? roster : null;
  const people = ready?.roster.people ?? [];
  const exists = ready?.roster.existingReportId ?? null;
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
    isMarked(draft.answers[person.memberId]),
  ).length;
  const remaining = people.length - markedCount;
  const groupValues: Record<GroupTextField, string> = {
    prayer: draft.prayer,
    praise: draft.praise,
    discussion: draft.discussion,
  };
  const heading = step === "review" ? t("reviewTitle") : t("newTitle");
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
        <span className="pr-2 text-sm font-semibold text-muted tabular-nums">
          {t("stepCount", { current: STEP_NUMBER[step], total: TOTAL_STEPS })}
        </span>
      </header>

      <div className="hidden md:block">
        <StaffAppPageHeader
          actions={
            step === "meeting" ? undefined : (
              <ReportStepper current={STEP_NUMBER[step]} />
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
          canChoose={ready !== null && exists === null && !noPeople}
          date={date}
          dateProblem={dateProblem}
          filedDates={filedDates}
          group={group}
          groups={groups}
          mode={mode}
          noPeople={noPeople}
          rosterLoading={roster.status === "loading"}
          scoped={scoped}
          today={today}
          onAddressChange={(address) => edit({ address })}
          onCancel={cancel}
          onChooseMode={chooseMode}
          onDateChange={changeDate}
          onGroupChange={changeGroup}
        />
      )}

      {step === "people" && ready && person && (
        <PersonStep
          answer={draft.answers[person.memberId]}
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
          onChange={(patch) => answer(person.memberId, patch)}
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
          values={groupValues}
          onBack={() => setStep("people")}
          onChange={(field, value) => edit({ [field]: value })}
          onNext={() => {
            setReviewFrom("group");
            setStep("review");
          }}
        />
      )}

      {step === "review" && ready && (
        <div className="flex max-w-[1000px] flex-col gap-4">
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
          <ReportListStep
            observationsVisible
            tintUnanswered
            answers={draft.answers}
            footer={
              <>
                <div className="flex min-w-0 flex-1 basis-[240px] flex-col gap-2">
                  {blocking && (
                    <div
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground"
                      role="alert"
                    >
                      <ExclamationCircleIcon
                        aria-hidden="true"
                        className="size-5 shrink-0"
                      />
                      <span className="min-w-0 flex-1">{blocking.message}</span>
                      {blocking.kind === "rosterChanged" && (
                        <Button
                          isPending={reloading}
                          size="sm"
                          variant="outline"
                          onPress={reloadPeople}
                        >
                          {t("reloadPeople")}
                        </Button>
                      )}
                    </div>
                  )}
                  <p
                    className={
                      remaining > 0
                        ? "text-[13px] font-semibold text-warning-soft-foreground"
                        : "text-[13px] text-muted"
                    }
                  >
                    {remaining > 0
                      ? t("remaining", { count: remaining })
                      : t("allMarked")}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                  <Button
                    className="flex-1 gap-2 font-semibold sm:flex-none"
                    isDisabled={isSubmitting}
                    variant="outline"
                    onPress={() =>
                      reviewFrom === "group"
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
            groupValues={groupValues}
            meetingDate={date}
            people={people}
            shortSundayLabel={shortSundayLabel}
            onAnswer={answer}
            onGroupText={(field, value) => edit({ [field]: value })}
          />
        </div>
      )}
    </>
  );
}
