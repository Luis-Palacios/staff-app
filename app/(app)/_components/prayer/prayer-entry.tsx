import type { ReportSharedEntry } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { textLink } from "@/components/primitives";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";

/**
 * One group's text in a section: the group block (name, leaders, meeting date) on the left, the
 * text and its actions on the right. They stack below `md`.
 */
export function PrayerEntry({
  entry,
  text,
}: {
  entry: ReportSharedEntry;
  /** This section's text of the entry, never empty. */
  text: string;
}) {
  const t = useTranslations("PrayerDashboard");
  const locale = useLocale() as Locale;
  const date = formatCalendarShortWeekdayDate(entry.meetingDate, locale);

  return (
    <li className="flex flex-col gap-x-7 gap-y-2.5 border-t border-separator p-4 md:flex-row md:px-[22px] md:py-[18px]">
      <div className="flex flex-col gap-[3px] md:w-60 md:shrink-0">
        <span className="text-[15px] font-semibold text-heading">
          {entry.smallGroup.name}
        </span>
        {entry.leaders.length > 0 && (
          <span className="text-[13px] text-muted">
            {entry.leaders.map((leader) => leader.name).join(" · ")}
          </span>
        )}
        <span className="text-[13px] tabular-nums text-muted">{date}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="max-w-[72ch] whitespace-pre-line text-[15.5px] leading-[1.6] text-foreground">
          {text}
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <NextLink
            aria-label={t("viewReportAria", {
              group: entry.smallGroup.name,
              date,
            })}
            className={textLink({
              className:
                "inline-flex min-h-11 items-center px-1.5 text-[13.5px] md:min-h-10",
            })}
            href={`/groups/reports/${entry.reportId}`}
          >
            {t("viewReport")}
          </NextLink>
        </div>
      </div>
    </li>
  );
}
