import type {
  ReportSummaryGroup,
  ReportWeek,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { Settled } from "@/lib/settle";

import { getLocale, getTranslations } from "next-intl/server";
import NextLink from "next/link";

import { notFiledMeetingsHref } from "./report-week/week-rows";

import { card, textLink, title } from "@/components/primitives";
import { getChurchToday } from "@/lib/church-time";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";

/** Open groups with at least this many not-filed meetings in the 28-day window need follow-up. */
export const FOLLOW_UP_MIN_NOT_FILED = 2;

const dayChip =
  "flex h-7 w-[38px] items-center justify-center rounded-lg border-[1.5px] text-xs font-semibold tabular-nums";

type FollowUpItem = { group: ReportSummaryGroup; behind: boolean };

/** Behind groups first (most missed, then name), then groups with no leader (by name). */
function followUpItems(
  groups: ReportSummaryGroup[],
  locale: Locale,
): FollowUpItem[] {
  const open = groups.filter((entry) => entry.smallGroup.closedAt === null);
  const byName = (a: ReportSummaryGroup, b: ReportSummaryGroup) =>
    a.smallGroup.name.localeCompare(b.smallGroup.name, locale);
  const behind = open
    .filter((entry) => entry.notFiledDates.length >= FOLLOW_UP_MIN_NOT_FILED)
    .sort(
      (a, b) => b.notFiledDates.length - a.notFiledDates.length || byName(a, b),
    );
  const noLeader = open
    .filter(
      (entry) =>
        !entry.hasLeader &&
        entry.notFiledDates.length < FOLLOW_UP_MIN_NOT_FILED,
    )
    .sort(byName);

  return [
    ...behind.map((group) => ({ group, behind: true })),
    ...noLeader.map((group) => ({ group, behind: false })),
  ];
}

/**
 * **Needs follow-up**: groups behind on reports or without a leader, as of today (it doesn't
 * follow the week stepper). Hidden when nothing qualifies. Leaders' names come from the week
 * call, because the summary doesn't carry them; without it the card just omits them.
 */
export async function NeedsFollowUpCard({
  summary,
  week,
}: {
  summary: Promise<Settled<ReportSummaryGroup[]>>;
  week: Promise<Settled<ReportWeek>>;
}) {
  const [result, weekResult, t, locale] = await Promise.all([
    summary,
    week,
    getTranslations("GroupsDashboard"),
    getLocale(),
  ]);
  const items = result.ok ? followUpItems(result.value, locale as Locale) : [];

  if (result.ok && items.length === 0) return null;

  const leaders = new Map(
    weekResult.ok
      ? weekResult.value.groups.map((entry) => [
          entry.smallGroup.id,
          entry.leaders.map((leader) => leader.name).join(" · "),
        ])
      : [],
  );
  const today = getChurchToday();
  const list = new Intl.ListFormat(locale, { type: "conjunction" });
  const actionClass = textLink({
    className: "inline-flex min-h-11 items-center text-sm",
  });

  return (
    <section
      aria-labelledby="follow-up"
      className={card({
        className: "flex flex-col gap-4 px-[22px] pb-[22px] pt-5",
      })}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2.5">
        <div className="flex flex-col gap-0.5">
          <h2
            className={title({
              size: "sm",
              className: "flex items-center gap-2.5",
            })}
            id="follow-up"
          >
            {t("followUpTitle")}
            {result.ok && (
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-warning-soft px-[7px] font-sans text-[12.5px] font-bold text-warning-soft-foreground">
                {items.length}
              </span>
            )}
          </h2>
          <p className="text-[13.5px] text-muted">{t("followUpDescription")}</p>
        </div>
        {result.ok && (
          <div
            aria-hidden="true"
            className="flex items-center gap-3.5 text-[12.5px] text-muted"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3.5 rounded bg-success-soft ring-[1.5px] ring-inset ring-success-soft-foreground" />
              {t("legendFiled")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3.5 rounded border-[1.5px] border-dashed border-warning-soft-foreground bg-warning-soft" />
              {t("legendNotFiled")}
            </span>
          </div>
        )}
      </div>

      {!result.ok ? (
        <p className="text-sm text-muted">{t("followUpLoadFailed")}</p>
      ) : (
        <ul className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3 p-0">
          {items.map(({ group, behind }) => {
            const { smallGroup, recentMeetings, notFiledDates } = group;
            const names = leaders.get(smallGroup.id);
            // The API sends newest first; the chips read oldest to newest.
            const meetings = [...recentMeetings].reverse();
            const label = t("meetingsLabel", {
              list: list.format(
                meetings.map((meeting) =>
                  t(
                    meeting.reportId === null
                      ? "meetingNotFiled"
                      : "meetingFiled",
                    {
                      date: formatCalendarShortWeekdayDate(
                        meeting.date,
                        locale as Locale,
                      ),
                    },
                  ),
                ),
              ),
            });
            const actionLabel = behind ? t("seeMeetings") : t("openGroup");

            return (
              <li
                key={smallGroup.id}
                className="flex list-none flex-col gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3.5"
              >
                <span className="flex flex-col gap-0.5">
                  <NextLink
                    className="text-[15.5px] font-semibold text-heading hover:underline"
                    href={`/groups/${smallGroup.id}`}
                  >
                    {smallGroup.name}
                  </NextLink>
                  {names && (
                    <span className="text-[13px] text-muted">{names}</span>
                  )}
                </span>
                {behind ? (
                  <span className="flex flex-col gap-2">
                    <span
                      aria-label={label}
                      className="flex gap-1.5"
                      role="img"
                    >
                      {meetings.map((meeting) => (
                        <span
                          key={meeting.date}
                          className={
                            meeting.reportId === null
                              ? `${dayChip} border-dashed border-warning-soft-foreground bg-warning-soft text-warning-soft-foreground`
                              : `${dayChip} border-solid border-success-soft-foreground bg-success-soft text-success-soft-foreground`
                          }
                        >
                          {Number(meeting.date.slice(8))}
                        </span>
                      ))}
                    </span>
                    <span className="text-[13.5px] font-semibold text-warning-soft-foreground">
                      {t("behind", {
                        missed: notFiledDates.length,
                        total: recentMeetings.length,
                      })}
                    </span>
                  </span>
                ) : (
                  <span className="text-[13.5px] font-semibold text-warning-soft-foreground">
                    {t("noLeaderLine")}
                  </span>
                )}
                <NextLink
                  aria-label={`${actionLabel}: ${smallGroup.name}`}
                  className={`${actionClass} self-start`}
                  href={
                    behind
                      ? notFiledMeetingsHref(smallGroup.id, today)
                      : `/groups/${smallGroup.id}`
                  }
                >
                  {actionLabel}
                </NextLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
