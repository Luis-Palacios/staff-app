"use client";

import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

export interface DateProblem {
  message: string;
  /** Set for a duplicate date, so the field can link to the report already filed. */
  existingReportId: number | null;
}

/** What is wrong with the meeting date, under the date field (with a link to the existing report). */
export function DateProblemNote({ problem }: { problem: DateProblem | null }) {
  const t = useTranslations("ReportForm");

  // The wrapper stays so `aria-describedby` on the field always finds its target.
  return (
    <div id="meeting-date-problem">
      {problem && (
        <p
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-danger"
          role="alert"
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="size-4 shrink-0"
          />
          <span>{problem.message}</span>
          {problem.existingReportId !== null && (
            <NextLink
              className="font-semibold underline underline-offset-2"
              href={`/groups/reports/${problem.existingReportId}`}
            >
              {t("openExisting")}
            </NextLink>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * The date is already marked as no meeting. Not an error: the leader can replace the mark with a
 * report (nothing is deleted until the report is submitted) or open the mark. After replacing, a
 * muted line says what will happen, with Undo.
 */
export function NoMeetingOnDateNote({
  date,
  shortDate,
  reason,
  existingReportId,
  replacing,
  onReplace,
  onUndo,
}: {
  /** "Thursday, Oct 1" */
  date: string;
  /** "Oct 1" */
  shortDate: string;
  reason: string | null;
  existingReportId: number;
  replacing: boolean;
  onReplace: () => void;
  onUndo: () => void;
}) {
  const t = useTranslations("ReportForm");

  if (replacing) {
    return (
      <p
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted"
        role="status"
      >
        <span>{t("replacing", { date: shortDate })}</span>
        <button
          className="rounded-sm font-semibold text-heading underline underline-offset-2 outline-none focus-visible:shadow-[var(--shadow-focus)]"
          type="button"
          onClick={onUndo}
        >
          {t("undo")}
        </button>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-tile border border-warning/40 bg-warning-soft p-4 text-sm text-warning-soft-foreground">
      <p className="flex items-start gap-2">
        <InformationCircleIcon
          aria-hidden="true"
          className="mt-0.5 size-[18px] shrink-0"
        />
        <span>
          <strong className="font-semibold">
            {t("noMeetingOnDate", { date })}
          </strong>
          {reason && <em className="ml-1 font-display">{`“${reason}”`}</em>}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          className="font-semibold"
          size="sm"
          variant="outline"
          onPress={onReplace}
        >
          {t("replaceWithReport")}
        </Button>
        <NextLink
          className="text-[13px] font-semibold underline underline-offset-2"
          href={`/groups/reports/${existingReportId}`}
        >
          {t("openNoMeeting")}
        </NextLink>
      </div>
    </div>
  );
}
