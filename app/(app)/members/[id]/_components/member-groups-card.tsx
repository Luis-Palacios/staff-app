import type { MemberSmallGroup, SmallGroupRole } from "@/api/members-api/types";
import type { Locale } from "@/lib/locale-shared";

import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { StatusBadge, type StatusBadgeProps } from "@/components/status-badge";
import { formatCalendarDate } from "@/lib/format-date";

const ROLE_BADGE: Record<
  SmallGroupRole,
  Pick<StatusBadgeProps, "tone" | "variant">
> = {
  leader: { tone: "warning", variant: "solid-dot" },
  co_leader: { tone: "accent", variant: "solid-dot" },
  member: { tone: "neutral", variant: "ring-dot" },
};

// Group names are user data (never translated); each links to its group.
export function MemberGroupsCard({
  smallGroups,
}: {
  smallGroups: MemberSmallGroup[];
}) {
  const t = useTranslations("MemberGroupsCard");
  const tRole = useTranslations("SmallGroupRole");
  const locale = useLocale() as Locale;

  return (
    <section
      className={card({
        className:
          "flex min-w-0 flex-[3_1_340px] flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")}>{t("title")}</DetailCardHeading>
      {smallGroups.length === 0 ? (
        <div className="flex flex-col gap-1 py-3">
          <p className="text-[15px] font-semibold text-heading">
            {t("emptyTitle")}
          </p>
          <p className="text-sm text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {smallGroups.map((group) => (
            <li
              key={group.smallGroupId}
              className="flex flex-wrap items-center gap-3.5 py-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground">
                <UserGroupIcon
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.7}
                />
              </span>
              <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                <NextLink
                  className={textLink({ className: "break-words text-[15px]" })}
                  href={`/groups/${group.smallGroupId}`}
                >
                  {group.smallGroupName}
                </NextLink>
                <span className="text-[13px] text-muted">
                  {t("joined", {
                    date: formatCalendarDate(group.joinedAt, locale),
                  })}
                </span>
              </div>
              <StatusBadge {...ROLE_BADGE[group.role]}>
                {tRole(group.role)}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
