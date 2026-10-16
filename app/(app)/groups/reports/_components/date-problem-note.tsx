"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
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
