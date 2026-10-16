import type {
  ReportAttendance,
  ReportDetail,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { ReportAttendanceTable } from "./report-attendance-table";

import { formatChurchSunday } from "@/app/(app)/groups/reports/_lib/format-church-sunday";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card, title } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarDate } from "@/lib/format-date";

// A streak shows from 2 up (rule 11); a recent joiner gets "In the group since" instead.
const MIN_STREAK = 2;

/** The join date when it falls in the 30 days before the meeting, else null. */
function recentJoinDate(
  joinedAt: string | undefined,
  meetingDate: string,
): string | null {
  if (!joinedAt || joinedAt > meetingDate) return null;

  const days =
    (Date.parse(`${meetingDate}T00:00:00Z`) -
      Date.parse(`${joinedAt}T00:00:00Z`)) /
    86_400_000;

  return days <= 30 ? joinedAt : null;
}

function AttendedBadge({
  yes,
  yesLabel,
  noLabel,
}: {
  yes: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return yes ? (
    <StatusBadge tone="success">{yesLabel}</StatusBadge>
  ) : (
    <StatusBadge tone="neutral" variant="ring-dot">
      {noLabel}
    </StatusBadge>
  );
}

// The attendance table (md and up) and person blocks (below md), with totals. The observation
// column exists only when `observationsVisible`: the API leaves the field out otherwise (rule 9).
export async function ReportAttendanceCard({
  report,
  joinedByMember,
  linkMembers,
}: {
  report: ReportDetail;
  /** Active membership start dates, to say "In the group since" for new people. */
  joinedByMember: Record<number, string>;
  /** Member pages are for full roles only. */
  linkMembers: boolean;
}) {
  const [t, tRole, locale] = await Promise.all([
    getTranslations("ReportDetail"),
    getTranslations("SmallGroupRole"),
    getLocale(),
  ]);
  const { attendances, totals, observationsVisible, meetingDate } = report;
  const typedLocale = locale as Locale;
  const sunday = formatChurchSunday(report.churchSunday, typedLocale);

  const subLine = (person: ReportAttendance) => {
    if (person.missedStreak >= MIN_STREAK) {
      return (
        <span className="font-semibold text-warning-soft-foreground">
          {t("missedStreak", { count: person.missedStreak })}
        </span>
      );
    }

    const joined = recentJoinDate(joinedByMember[person.memberId], meetingDate);

    return joined
      ? t("joinedSince", { date: formatCalendarDate(joined, typedLocale) })
      : tRole(person.role);
  };

  const hrefFor = (person: ReportAttendance) =>
    linkMembers ? `/members/${person.memberId}` : undefined;
  const totalsObservations =
    observationsVisible && totals.observations !== undefined
      ? t("obsCount", { count: totals.observations })
      : null;
  const groupTotal = t("ofTotal", {
    count: totals.attendedGroup,
    total: totals.roster,
  });
  const churchTotal = t("ofTotal", {
    count: totals.attendedChurch,
    total: totals.roster,
  });

  return (
    <section className={card({ className: "flex flex-col overflow-hidden" })}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-[22px] pb-4 pt-6">
        <div className="flex flex-col items-start gap-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("people")}
          </p>
          <h2 className={title({ size: "sm", className: "text-[22px]" })}>
            {t("attendance")}
          </h2>
        </div>
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          {observationsVisible && (
            <LockClosedIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
              strokeWidth={1.8}
            />
          )}
          {observationsVisible ? t("obsPrivacy") : t("obsHidden")}
        </p>
      </header>

      {/* md and up: the table. */}
      <div className="hidden md:block">
        <ReportAttendanceTable
          labels={{
            table: t("attendance"),
            member: t("member"),
            colMeeting: t("colMeeting"),
            colChurch: t("colChurch", { sunday }),
            observation: t("observation"),
            attended: t("attended"),
            absent: t("absent"),
            atChurch: t("atChurch"),
            notAtChurch: t("notAtChurch"),
          }}
          rows={attendances.map((person) => ({
            memberId: person.memberId,
            name: person.name,
            href: hrefFor(person),
            sub: subLine(person),
            attendedGroup: person.attendedGroup,
            attendedChurch: person.attendedChurch,
            observation: person.observation,
          }))}
          showObservations={observationsVisible}
        />
        <dl className="flex flex-wrap items-center gap-x-10 gap-y-1 border-t border-border bg-surface-secondary/50 px-[22px] py-3 text-[13.5px] font-semibold text-heading">
          <dt className="text-xs uppercase tracking-[0.06em] text-muted">
            {t("totals")}
          </dt>
          <dd className="tabular-nums">{groupTotal}</dd>
          <dd className="tabular-nums">{churchTotal}</dd>
          {totalsObservations && (
            <dd className="font-normal text-muted">{totalsObservations}</dd>
          )}
        </dl>
      </div>

      {/* Below md: a block per person, then a totals strip. */}
      <ul className="flex flex-col md:hidden">
        {attendances.map((person) => {
          const href = hrefFor(person);
          const nameClass = "text-[14.5px] font-semibold text-heading";

          return (
            <li
              key={person.memberId}
              className="flex flex-col gap-2.5 border-t border-separator px-[18px] py-3.5"
            >
              <div className="flex items-center gap-3">
                <InitialsAvatar name={person.name} />
                <div className="flex min-w-0 flex-col">
                  {href ? (
                    <NextLink
                      className={`${nameClass} hover:underline`}
                      href={href}
                    >
                      {person.name}
                    </NextLink>
                  ) : (
                    <span className={nameClass}>{person.name}</span>
                  )}
                  <span className="text-[12.5px] text-muted">
                    {subLine(person)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("colMeeting")}
                  </span>
                  <AttendedBadge
                    noLabel={t("absent")}
                    yes={person.attendedGroup}
                    yesLabel={t("attended")}
                  />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("colChurch", { sunday })}
                  </span>
                  <AttendedBadge
                    noLabel={t("notAtChurch")}
                    yes={person.attendedChurch}
                    yesLabel={t("atChurch")}
                  />
                </div>
              </div>
              {observationsVisible && person.observation && (
                <p className="whitespace-pre-line rounded-tile bg-surface-secondary px-3 py-2 text-[13.5px] leading-snug">
                  {person.observation}
                </p>
              )}
            </li>
          );
        })}
        <li className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border bg-surface-secondary/50 px-[18px] py-3 text-[13.5px] font-semibold text-heading">
          <span className="text-xs uppercase tracking-[0.06em] text-muted">
            {t("totals")}
          </span>
          <span className="tabular-nums">{groupTotal}</span>
          <span className="tabular-nums">{churchTotal}</span>
          {totalsObservations && (
            <span className="font-normal text-muted">{totalsObservations}</span>
          )}
        </li>
      </ul>
    </section>
  );
}
