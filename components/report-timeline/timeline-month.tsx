import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { formatCalendarMonth } from "@/lib/format-date";

/**
 * A month's heading over its rows, with what it holds: reports and care log entries, or *Status
 * change* when it holds neither. With `ahead` it is the *Coming up* heading above the months
 * (care spec rule 11), counted "N planned".
 */
export function TimelineMonth({
  month,
  reports,
  care = 0,
  ahead,
  children,
}: {
  /** Any date in the month, "YYYY-MM-DD". */
  month: string;
  reports: number;
  care?: number;
  /** Planned entries still ahead: this is the *Coming up* block, not a month. */
  ahead?: number;
  children: ReactNode;
}) {
  const t = useTranslations("ReportTimeline");
  const tCare = useTranslations("CareLog");
  const locale = useLocale() as Locale;
  const label =
    ahead === undefined
      ? formatCalendarMonth(month, locale)
      : tCare("comingUp");
  const parts = [
    reports > 0 ? t("monthCount", { count: reports }) : "",
    care > 0 ? tCare("monthCount", { count: care }) : "",
  ].filter(Boolean);
  const count =
    ahead !== undefined
      ? tCare("comingUpCount", { count: ahead })
      : parts.length > 0
        ? parts.join(" · ")
        : t("statusChange");

  return (
    <section aria-label={label} className="first:[&>div]:border-t-0">
      <div className="flex items-center justify-between gap-3 border-y border-border bg-surface-secondary px-4 md:px-6 py-2.5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-heading">
          {label}
        </h3>
        <span className="text-[13px] tabular-nums text-muted">{count}</span>
      </div>
      <ol className="flex flex-col">{children}</ol>
    </section>
  );
}
