import type {
  MemberPastSmallGroup,
  MemberSmallGroup,
  SmallGroupRole,
} from "@/api/members-api/types";
import type { Locale } from "@/lib/locale-shared";

import { ChevronRightIcon, UserGroupIcon } from "@heroicons/react/24/outline";
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

// Group names are user data (never translated). `self` is My profile: its own title and empty
// state, full-width rows, and each row a link with a chevron when `canOpen` says the viewer
// can open that group (the rest are plain rows).
export function MemberGroupsCard({
  smallGroups,
  pastGroups,
  variant = "default",
  canOpen = () => true,
  leaders = {},
}: {
  smallGroups: MemberSmallGroup[];
  /** An inactive member: their `pastSmallGroups` replace the current groups (default variant). */
  pastGroups?: MemberPastSmallGroup[];
  variant?: "default" | "self";
  canOpen?: (group: MemberSmallGroup) => boolean;
  /** Leader name by small group id; a group without an entry shows no leader line. */
  leaders?: Record<number, string>;
}) {
  const t = useTranslations("MemberGroupsCard");
  const tSelf = useTranslations("MyProfilePage");
  const tRole = useTranslations("SmallGroupRole");
  const locale = useLocale() as Locale;
  const self = variant === "self";
  const past = !self && pastGroups !== undefined;
  const rows: MemberSmallGroup[] = past ? pastGroups : smallGroups;
  const joined = (group: MemberSmallGroup) =>
    past
      ? t("endedInactive", {
          from: formatCalendarDate(group.joinedAt, locale),
          to: formatCalendarDate(
            (group as MemberPastSmallGroup).leftAt,
            locale,
          ),
        })
      : t("joined", { date: formatCalendarDate(group.joinedAt, locale) });
  const leaderLine = (group: MemberSmallGroup) => {
    const name = past ? undefined : leaders[group.smallGroupId];

    return name ? (
      <span className="break-words text-[13px] text-muted">
        {t("leader", { name })}
      </span>
    ) : null;
  };

  return (
    <section
      className={card({
        className: self
          ? "flex min-w-0 flex-col overflow-hidden pt-5"
          : "flex min-w-0 flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <div className={self ? "px-6 pb-4" : undefined}>
        <DetailCardHeading eyebrow={t("eyebrow")}>
          {self ? tSelf("groupsTitle") : past ? t("pastTitle") : t("title")}
        </DetailCardHeading>
      </div>
      {rows.length === 0 ? (
        <div
          className={
            self
              ? "flex flex-col gap-1 border-t border-separator px-6 pb-[26px] pt-[22px]"
              : "flex flex-col gap-1 py-3"
          }
        >
          <p className="text-[15px] font-semibold text-heading">
            {past ? t("pastEmptyTitle") : t("emptyTitle")}
          </p>
          <p className="text-sm text-muted">
            {self
              ? tSelf("groupsEmptyBody")
              : past
                ? t("pastEmptyBody")
                : t("emptyBody")}
          </p>
        </div>
      ) : self ? (
        <ul className="flex flex-col">
          {smallGroups.map((group) => {
            const open = canOpen(group);
            const row = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground">
                  <UserGroupIcon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.7}
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="break-words text-[15px] font-semibold text-heading">
                    {group.smallGroupName}
                  </span>
                  {leaderLine(group)}
                  <span className="text-[13px] text-muted">
                    {joined(group)}
                  </span>
                </span>
                <StatusBadge {...ROLE_BADGE[group.role]}>
                  {tRole(group.role)}
                </StatusBadge>
                {/* Non-openable rows keep an empty slot so the badges line up. */}
                {open ? (
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-subtle"
                    strokeWidth={2}
                  />
                ) : (
                  <span aria-hidden="true" className="size-4 shrink-0" />
                )}
              </>
            );
            const rowClass =
              "flex items-center gap-3.5 border-t border-separator px-6 py-3.5";

            return (
              <li key={group.smallGroupId}>
                {open ? (
                  <NextLink
                    className={`${rowClass} transition-colors hover:bg-surface-secondary`}
                    href={`/groups/${group.smallGroupId}`}
                  >
                    {row}
                  </NextLink>
                ) : (
                  <div className={rowClass}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {rows.map((group) => (
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
                {canOpen(group) ? (
                  <NextLink
                    className={textLink({
                      className: "break-words text-[15px]",
                    })}
                    href={`/groups/${group.smallGroupId}`}
                  >
                    {group.smallGroupName}
                  </NextLink>
                ) : (
                  <span className="break-words text-[15px] font-semibold text-heading">
                    {group.smallGroupName}
                  </span>
                )}
                {leaderLine(group)}
                <span className="text-[13px] text-muted">{joined(group)}</span>
              </div>
              <StatusBadge
                {...(past ? ROLE_BADGE.member : ROLE_BADGE[group.role])}
              >
                {tRole(group.role)}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
