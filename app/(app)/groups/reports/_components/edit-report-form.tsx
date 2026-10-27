"use client";

import type {
  ReportDetail,
  ReportRoster,
  ReportSectionKey,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { ReportDraft } from "@/app/(app)/groups/reports/_lib/report-draft";

import { useRef, useState, useTransition } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import {
  Button,
  buttonVariants,
  Description,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { type DateProblem, DateProblemNote } from "./date-problem-note";
import { MeetingDatePicker } from "./meeting-date-picker";
import { ReportFooterStatus } from "./report-footer-status";
import { useReportGuests } from "./report-guests";
import { isMarked, ReportListStep } from "./report-list-step";

import {
  getReportRosterAction,
  updateReportAction,
  type ReportFailure,
} from "@/app/(app)/groups/reports/_actions/report-actions";
import { guestsFirst, personKey } from "@/app/(app)/groups/reports/_lib/person";
import {
  type DraftItem,
  type DraftItems,
  type DraftSegment,
  newDraftItem,
} from "@/app/(app)/groups/reports/_lib/report-items-draft";
import { tagContextOf } from "@/app/(app)/groups/reports/_lib/report-tags";
import { toReportInput } from "@/app/(app)/groups/reports/_lib/report-body";
import { ADDRESS_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { card } from "@/components/primitives";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";

const DATE_FAILURES: readonly (string | undefined)[] = [
  "exists",
  "future",
  "notLeaderOnDate",
];

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

/** The report's own rows as answers, keyed by `personKey`. */
function answersOf(report: ReportDetail): ReportDraft["answers"] {
  return Object.fromEntries(
    report.attendances.map((row) => [
      personKey(row.person),
      {
        attendedGroup: row.attendedGroup,
        attendedChurch: row.attendedChurch,
        observation: row.observation ?? "",
      },
    ]),
  );
}

/**
 * Edit a filed report: the same list as the review, prefilled, with the date and address on top.
 * The roster is the one for the (possibly new) date: people on it keep their answers, new people
 * start unanswered. When `observationsVisible` is false the note column isn't rendered and no
 * observation is sent, so the API keeps them (rule 9).
 */
export function EditReportForm({
  report,
  initialRoster,
  today,
  filedDates,
  noMeetingDates,
  editMeta,
}: {
  report: ReportDetail;
  initialRoster: ReportRoster;
  today: string;
  filedDates: string[];
  noMeetingDates: string[];
  /** "Submitted by … on …", formatted on the server in the church's time zone. */
  editMeta: string;
}) {
  const t = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [isSaving, startSave] = useTransition();
  const [date, setDate] = useState(report.meetingDate);
  const [roster, setRoster] = useState<
    | { status: "ready"; roster: ReportRoster; existsMessage: string | null }
    | { status: "loading" }
    | { status: "error"; message: string }
  >({ status: "ready", roster: initialRoster, existsMessage: null });
  const [draft, setDraft] = useState<ReportDraft>(() => ({
    address: report.address ?? "",
    items: itemsOf(report),
    met: true,
    reason: "",
    replacing: false,
    answers: answersOf(report),
  }));
  const [failure, setFailure] = useState<ReportFailure | null>(null);
  const [reloading, setReloading] = useState(false);
  const latest = useRef(draft);
  const knownDates = new Set(filedDates);
  const knownNoMeetingDates = new Set(noMeetingDates);

  function edit(patch: Partial<ReportDraft>) {
    latest.current = { ...latest.current, ...patch };
    setDraft(latest.current);
  }

  function answer(key: string, patch: Partial<ReportDraft["answers"][string]>) {
    const { answers } = latest.current;

    edit({
      answers: {
        ...answers,
        [key]: {
          ...(answers[key] ?? {
            attendedGroup: null,
            attendedChurch: null,
            observation: "",
          }),
          ...patch,
        },
      },
    });
  }

  function loadRoster(nextDate: string, done?: () => void) {
    void getReportRosterAction(report.smallGroup.id, nextDate).then(
      (result) => {
        done?.();
        setRoster(
          result.ok
            ? {
                status: "ready",
                roster: result.roster,
                existsMessage: result.existsMessage,
              }
            : { status: "error", message: result.message },
        );
      },
    );
  }

  function changeDate(next: string) {
    if (next === date) return;

    setFailure(null);
    setDate(next);
    setRoster({ status: "loading" });
    loadRoster(next);
  }

  function save() {
    if (roster.status !== "ready") return;

    const input = toReportInput(
      latest.current,
      roster.roster,
      date,
      report.observationsVisible,
    );

    if (!input) return;

    setFailure(null);
    startSave(async () => {
      // Success redirects to the report and never returns here.
      setFailure(
        await updateReportAction(report.id, report.smallGroup.id, input),
      );
    });
  }

  function reloadPeople() {
    setReloading(true);
    setFailure(null);
    loadRoster(date, () => setReloading(false));
  }

  // The roster for the date being edited, replacing the one shown; null when it can't be read.
  async function refreshRoster(): Promise<ReportRoster | null> {
    const result = await getReportRosterAction(report.smallGroup.id, date);

    if (!result.ok) return null;

    setRoster({
      status: "ready",
      roster: result.roster,
      existsMessage: result.existsMessage,
    });

    return result.roster;
  }

  const ready = roster.status === "ready" ? roster.roster : null;
  const audience = ready?.smallGroup.audience ?? report.smallGroup.audience;
  const people = guestsFirst(ready?.people ?? []);
  const guestActions = useReportGuests({
    groupId: report.smallGroup.id,
    groupName: report.smallGroup.name,
    audience,
    closed: report.smallGroup.closedAt !== null,
    date,
    today,
    reload: refreshRoster,
    // They came: the first question is answered; the church one is still theirs to answer.
    onAdded: (_next, key) => {
      answer(key, { attendedGroup: true });
    },
  });
  // The report's own date is "taken" by this very report (rule 1 ignores it).
  const takenBy = ready?.existingReportId ?? null;
  const dateProblem: DateProblem | null =
    failure && DATE_FAILURES.includes(failure.kind)
      ? {
          message: failure.message,
          existingReportId: failure.existingReportId ?? null,
        }
      : ready && takenBy !== null && takenBy !== report.id
        ? {
            message:
              roster.status === "ready" ? (roster.existsMessage ?? "") : "",
            existingReportId: takenBy,
          }
        : roster.status === "error"
          ? { message: roster.message, existingReportId: null }
          : null;
  const remaining = people.filter(
    (person) => !isMarked(draft.answers[personKey(person.person)]),
  ).length;
  const tagContext = tagContextOf({
    groupId: report.smallGroup.id,
    groupName: report.smallGroup.name,
    people,
    answers: draft.answers,
  });
  const blocking =
    failure && !DATE_FAILURES.includes(failure.kind) ? failure : null;

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label={t("meetingDetails")}
        className={card({ className: "p-5" })}
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-1.5">
            <MeetingDatePicker
              describedBy="meeting-date-problem"
              filedDates={knownDates}
              isInvalid={dateProblem !== null}
              meetingDay={initialRoster.smallGroup.meetingDay}
              noMeetingDates={knownNoMeetingDates}
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
            onChange={(address) => edit({ address })}
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
        <p className="mt-4 text-[13px] text-muted">{editMeta}</p>
      </section>

      <ReportListStep
        tintUnanswered
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
              <NextLink
                aria-disabled={isSaving}
                className={buttonVariants({
                  variant: "outline",
                  className: "flex-1 font-semibold text-heading sm:flex-none",
                })}
                href={`/groups/reports/${report.id}`}
              >
                {t("cancel")}
              </NextLink>
              <Button
                className="flex-1 gap-2 font-semibold sm:flex-none"
                isDisabled={
                  ready === null ||
                  remaining > 0 ||
                  people.length === 0 ||
                  dateProblem !== null
                }
                isPending={isSaving}
                onPress={save}
              >
                <CheckIcon
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.2}
                />
                {t("save")}
              </Button>
            </div>
          </>
        }
        guests={guestActions.controls}
        items={draft.items}
        meetingDate={date}
        observationsVisible={report.observationsVisible}
        people={people}
        shortSundayLabel={
          ready
            ? formatCalendarShortWeekdayDate(ready.churchSunday, locale)
            : ""
        }
        tagContext={tagContext}
        onAnswer={answer}
        onItems={(section, next) =>
          edit({ items: { ...latest.current.items, [section]: next } })
        }
      />

      {guestActions.dialogs}
    </div>
  );
}
