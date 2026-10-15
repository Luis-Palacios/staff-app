import type { SmallGroupRole } from "@/api/members-api/types";
import type {
  SmallGroupDetail,
  SmallGroupMember,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";
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

const ROLE_ORDER: Record<SmallGroupRole, number> = {
  leader: 0,
  co_leader: 1,
  member: 2,
};

/** Leader, co-leaders, members; then by name. */
function sortMembers(members: SmallGroupMember[]): SmallGroupMember[] {
  return [...members].sort(
    (a, b) =>
      ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
      a.memberName.localeCompare(b.memberName),
  );
}

export function GroupMembersCard({ group }: { group: SmallGroupDetail }) {
  const t = useTranslations("GroupMembersCard");
  const tRole = useTranslations("SmallGroupRole");
  const locale = useLocale() as Locale;
  const members = sortMembers(group.members);

  return (
    <section
      className={card({
        className:
          "flex min-w-0 flex-[3_1_340px] flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")}>{t("title")}</DetailCardHeading>
      {group.closedAt || members.length === 0 ? (
        <div className="flex flex-col gap-1 py-3">
          <p className="text-[15px] font-semibold text-heading">
            {group.closedAt
              ? t("closedTitle", {
                  date: formatCalendarDate(group.closedAt, locale),
                })
              : t("emptyTitle")}
          </p>
          <p className="text-sm text-muted">
            {group.closedAt ? t("closedBody") : t("emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {members.map((member) => (
            <li
              key={member.memberId}
              className="flex flex-wrap items-center gap-3.5 py-3"
            >
              <InitialsAvatar name={member.memberName} />
              <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                <NextLink
                  className="break-words text-[15px] font-semibold text-heading hover:underline"
                  href={`/members/${member.memberId}`}
                >
                  {member.memberName}
                </NextLink>
                <span className="text-[13px] text-muted">
                  {t("joined", {
                    date: formatCalendarDate(member.joinedAt, locale),
                  })}
                </span>
              </div>
              <StatusBadge {...ROLE_BADGE[member.role]}>
                {tRole(member.role)}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
