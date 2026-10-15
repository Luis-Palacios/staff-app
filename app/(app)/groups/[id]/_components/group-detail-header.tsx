import type { SmallGroupDetail } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  ArrowLeftIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { title } from "@/components/primitives";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";
import { StatusBadge } from "@/components/status-badge";
import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { formatCalendarDate } from "@/lib/format-date";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

// The group is the page, as the person is on the member detail: tile, name as
// the <h1>, a meta line and the actions on the right. Closed groups are
// neutral and have no Edit action.
export function GroupDetailHeader({ group }: { group: SmallGroupDetail }) {
  const t = useTranslations("GroupDetailHeader");
  const tDay = useTranslations("Weekdays");
  const locale = useLocale() as Locale;
  const { id, name, meetingDay, closedAt, members } = group;
  const strong = (chunks: React.ReactNode) => (
    <strong className="font-semibold text-heading">{chunks}</strong>
  );

  return (
    <header className="mb-6 flex flex-col gap-6">
      <StaffAppBreadcrumbs
        items={[groupsBreadcrumb, { label: name, href: `/groups/${id}` }]}
      />
      <div className="flex flex-wrap items-center gap-5">
        <span
          className={clsx(
            "flex size-16 shrink-0 items-center justify-center rounded-[18px]",
            closedAt
              ? "bg-default text-muted"
              : "bg-accent text-accent-foreground",
          )}
        >
          <UserGroupIcon
            aria-hidden="true"
            className="size-8"
            strokeWidth={1.6}
          />
        </span>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className={title({ size: "md", className: "break-words" })}>
              {name}
            </h1>
            {closedAt && (
              <StatusBadge tone="neutral">
                {t("closedOn", { date: formatCalendarDate(closedAt, locale) })}
              </StatusBadge>
            )}
          </div>
          <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            {meetingDay !== null && (
              <span>
                {t.rich("meets", {
                  day: tDay(`sentence.${WEEKDAY_KEYS[meetingDay]}`),
                  strong,
                })}
              </span>
            )}
            <span>
              {closedAt
                ? t.rich("membersClosed", { strong })
                : t.rich("members", { count: members.length, strong })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <NextLink
            className={buttonVariants({
              variant: "outline",
              className: "gap-2 font-semibold text-heading",
            })}
            href="/groups"
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
            {t("allGroups")}
          </NextLink>
          {!closedAt && (
            <NextLink
              className={buttonVariants({
                variant: "primary",
                className: "gap-2",
              })}
              href={`/groups/${id}/edit`}
            >
              <PencilSquareIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
              {t("edit")}
            </NextLink>
          )}
        </div>
      </div>
    </header>
  );
}
