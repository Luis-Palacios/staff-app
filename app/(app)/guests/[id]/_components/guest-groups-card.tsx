import type { GuestDetail } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarDate } from "@/lib/format-date";

// The guest's time in guest groups, newest first, with why each ended.
export function GuestGroupsCard({
  guest,
  canOpen,
}: {
  guest: GuestDetail;
  /** Whether the viewer can open that group (the rest would 404). */
  canOpen: (groupId: number) => boolean;
}) {
  const t = useTranslations("GuestGroupsCard");
  const locale = useLocale() as Locale;
  const { groupHistory } = guest;

  return (
    <section
      className={card({
        className: "flex min-w-0 flex-col gap-3 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")}>{t("title")}</DetailCardHeading>
      {groupHistory.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {/* Group and date aren't unique: a guest marked inactive can rejoin the same group that day. */}
          {groupHistory.map((period, index) => (
            <li
              key={`${period.smallGroupId}-${period.joinedAt}-${index}`}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 py-3"
            >
              <span className="flex min-w-0 flex-col">
                {canOpen(period.smallGroupId) ? (
                  <NextLink
                    className={textLink({
                      className: "text-[15px] font-semibold",
                    })}
                    href={`/groups/${period.smallGroupId}`}
                  >
                    {period.smallGroupName}
                  </NextLink>
                ) : (
                  <span className="text-[15px] font-semibold text-heading">
                    {period.smallGroupName}
                  </span>
                )}
                <span className="text-[13px] text-muted">
                  {period.leftAt
                    ? t("range", {
                        from: formatCalendarDate(period.joinedAt, locale),
                        to: formatCalendarDate(period.leftAt, locale),
                      })
                    : t("since", {
                        date: formatCalendarDate(period.joinedAt, locale),
                      })}
                </span>
              </span>
              {period.leftAt === null ? (
                <StatusBadge tone="success">{t("current")}</StatusBadge>
              ) : (
                period.leftReason && (
                  <StatusBadge variant="ring-dot">
                    {t(`leftReason.${period.leftReason}`)}
                  </StatusBadge>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
