import type { SmallGroupSummary } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  CalendarIcon,
  ChevronRightIcon,
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarDate } from "@/lib/format-date";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

function Row({
  icon: Icon,
  label,
  missing,
  clamp,
  children,
}: {
  icon: typeof UserIcon;
  label: string;
  missing: boolean;
  clamp?: boolean;
  children: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <dt className="mt-px flex shrink-0">
        <Icon
          aria-label={label}
          className="size-4 text-muted"
          role="img"
          strokeWidth={1.7}
        />
      </dt>
      <dd
        className={clsx(
          "min-w-0 break-words text-sm leading-[1.4]",
          missing ? "text-subtle" : "text-foreground",
          clamp && "line-clamp-2",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

// One group on the list: name, leader, meeting day and address, member count.
// The whole card is the link. Closed groups are flat and neutral.
export function GroupCard({ group }: { group: SmallGroupSummary }) {
  const t = useTranslations("GroupsBrowser");
  const tDay = useTranslations("Weekdays");
  const locale = useLocale() as Locale;
  const closed = group.closedAt !== null;

  return (
    <NextLink
      className={card({
        interactive: true,
        className: clsx(
          "flex min-w-0 flex-1 flex-col gap-4 p-5",
          closed &&
            "bg-surface-secondary shadow-none dark:bg-surface-secondary",
        ),
      })}
      href={`/groups/${group.id}`}
    >
      <span className="flex items-start gap-3.5">
        <span
          className={clsx(
            "flex size-10 shrink-0 items-center justify-center rounded-tile",
            closed
              ? "bg-default text-muted"
              : "bg-accent-soft text-accent-soft-foreground",
          )}
        >
          <UserGroupIcon
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.7}
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <span
            className={clsx(
              "break-words font-display text-[21px] font-medium leading-[1.15] tracking-[-0.01em]",
              closed ? "text-foreground" : "text-heading",
            )}
          >
            {group.name}
          </span>
          {group.closedAt && (
            <StatusBadge tone="neutral">
              {t("closedOn", {
                date: formatCalendarDate(group.closedAt, locale),
              })}
            </StatusBadge>
          )}
        </span>
      </span>

      <dl className="flex flex-col gap-2">
        <Row icon={UserIcon} label={t("leader")} missing={!group.leaderName}>
          {group.leaderName ?? (closed ? t("noActiveLeader") : t("noLeader"))}
        </Row>
        <Row
          icon={CalendarIcon}
          label={t("meets")}
          missing={group.meetingDay === null}
        >
          {group.meetingDay === null
            ? t("dayNotSet")
            : tDay(WEEKDAY_KEYS[group.meetingDay])}
        </Row>
        <Row
          clamp
          icon={MapPinIcon}
          label={t("address")}
          missing={!group.meetingAddress}
        >
          {group.meetingAddress || t("noAddress")}
        </Row>
      </dl>

      <span className="mt-auto flex items-center justify-between gap-3 border-t border-separator pt-3.5 text-[13px] text-muted">
        <span>
          {closed
            ? t("membersClosed")
            : t.rich("members", {
                count: group.activeMemberCount,
                strong: (chunks) => (
                  <strong className="font-semibold text-heading">
                    {chunks}
                  </strong>
                ),
              })}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-link">
          {t("open")}
          <ChevronRightIcon
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={2}
          />
        </span>
      </span>
    </NextLink>
  );
}
