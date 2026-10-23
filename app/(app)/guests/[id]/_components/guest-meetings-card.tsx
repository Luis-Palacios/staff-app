import type { GuestDetail } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarDate } from "@/lib/format-date";

// The last 12 reports with a row for this guest, with the observation when the viewer may read it.
export function GuestMeetingsCard({
  guest,
  canOpenReport,
}: {
  guest: GuestDetail;
  /** `smallGroupReports: view`: the report link works for this viewer. */
  canOpenReport: boolean;
}) {
  const t = useTranslations("GuestMeetingsCard");
  const locale = useLocale() as Locale;
  const { recentAttendance } = guest;

  return (
    <section
      className={card({
        className: "flex min-w-0 flex-col gap-3 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")}>{t("title")}</DetailCardHeading>
      {recentAttendance.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {recentAttendance.map((meeting) => {
            const date = formatCalendarDate(meeting.meetingDate, locale);

            return (
              <li key={meeting.reportId} className="flex flex-col gap-1.5 py-3">
                <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <span className="flex min-w-0 flex-col">
                    {canOpenReport ? (
                      <NextLink
                        className={textLink({
                          className: "text-[15px] font-semibold",
                        })}
                        href={`/groups/reports/${meeting.reportId}`}
                      >
                        {date}
                      </NextLink>
                    ) : (
                      <span className="text-[15px] font-semibold text-heading">
                        {date}
                      </span>
                    )}
                    <span className="text-[13px] text-muted">
                      {meeting.smallGroup.name}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <StatusBadge
                      tone={meeting.attendedGroup ? "success" : "warning"}
                      variant={meeting.attendedGroup ? "solid-dot" : "ring-dot"}
                    >
                      {meeting.attendedGroup
                        ? t("cameGroup")
                        : t("missedGroup")}
                    </StatusBadge>
                    <StatusBadge
                      tone={meeting.attendedChurch ? "success" : "neutral"}
                      variant={
                        meeting.attendedChurch ? "solid-dot" : "ring-dot"
                      }
                    >
                      {meeting.attendedChurch
                        ? t("cameChurch")
                        : t("missedChurch")}
                    </StatusBadge>
                  </span>
                </span>
                {meeting.observation && (
                  <p className="whitespace-pre-line text-[14px] text-body">
                    {meeting.observation}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
