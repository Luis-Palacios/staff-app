import type { ReportStillToReport } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { ClockIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { textLink } from "@/components/primitives";
import { formatCalendarWeekday } from "@/lib/format-date";

/**
 * The groups that may still add texts this week, or that didn't file in a past week (rule 11).
 * "A and B (due), C (meets today)." Renders nothing when there are none.
 */
export function StillToReportNote({
  groups,
  isCurrentWeek,
  scoped,
  href,
}: {
  /** In the API's order: `notFiled`, `today`, `upcoming`, then by name. */
  groups: ReportStillToReport[];
  isCurrentWeek: boolean;
  scoped: boolean;
  /** Report status for that week, or My groups for a leader. */
  href: string;
}) {
  const t = useTranslations("PrayerDashboard");
  const locale = useLocale() as Locale;

  if (groups.length === 0) return null;

  const names = (list: ReportStillToReport[]) =>
    new Intl.ListFormat(locale, { type: "conjunction" }).format(
      list.map(({ smallGroup }) => smallGroup.name),
    );
  // Groups next to each other on the same day share their status ("A and B (due)").
  const statusOf = ({ status, meetingDate }: ReportStillToReport, n: number) =>
    status === "notFiled"
      ? t("stillDue", { n })
      : status === "today"
        ? t("stillToday", { n })
        : t("stillUpcoming", {
            n,
            weekday: formatCalendarWeekday(meetingDate, locale),
          });

  let list: string;

  if (isCurrentWeek) {
    const runs: ReportStillToReport[][] = [];

    for (const group of groups) {
      const last = runs.at(-1);

      if (
        last &&
        last[0].status === group.status &&
        (group.status === "notFiled" ||
          last[0].meetingDate === group.meetingDate)
      )
        last.push(group);
      else runs.push([group]);
    }
    list = runs
      .map((run) =>
        t("stillGroups", {
          names: names(run),
          status: statusOf(run[0], run.length),
        }),
      )
      .join(", ");
  } else {
    list = names(groups);
  }

  const lead = !isCurrentWeek
    ? t("stillPastWeek", { n: groups.length })
    : scoped
      ? t("stillThisWeekLeader", { n: groups.length })
      : t("stillThisWeek", { n: groups.length });

  return (
    <div className="flex items-start gap-3 rounded-xl bg-default px-4 py-3.5 text-foreground">
      <ClockIcon
        aria-hidden="true"
        className="mt-px size-5 shrink-0"
        strokeWidth={1.7}
      />
      <p className="text-sm leading-[1.55]">
        <strong className="font-semibold text-heading">{lead}</strong>{" "}
        {t("stillList", { list })}{" "}
        <NextLink
          className={textLink({ className: "underline-offset-[3px]" })}
          href={href}
        >
          {scoped ? t("seeMyGroups") : t("seeReportStatus")}
        </NextLink>
      </p>
    </div>
  );
}
