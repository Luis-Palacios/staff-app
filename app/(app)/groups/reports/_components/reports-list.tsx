import { ChartBarIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import ReportsBrowser from "./reports-browser";

import { getMe } from "@/api/members-api/client";
import {
  listSmallGroupReports,
  listSmallGroups,
} from "@/api/small-groups-api/client";
import {
  defaultReportRange,
  hasActiveFilters,
  REPORT_PAGE_SIZE,
  type ReportFilters,
} from "@/app/(app)/groups/reports/_lib/report-filters";
import { EmptyState } from "@/components/empty-state";
import { getChurchToday } from "@/lib/church-time";

/** Fetches the page the filters ask for and picks the table, or the right empty state. */
export default async function ReportsList({
  filters,
  scoped,
  canSubmit,
}: {
  filters: ReportFilters;
  scoped: boolean;
  canSubmit: boolean;
}) {
  const defaults = defaultReportRange(getChurchToday());
  const t = await getTranslations("ReportsPage");
  const [data, groups, me] = await Promise.all([
    listSmallGroupReports({
      ...(filters.groupId !== null && { smallGroupId: filters.groupId }),
      from: filters.from ?? defaults.from,
      to: filters.to ?? defaults.to,
      status: filters.status,
      q: filters.q,
      page: filters.page,
      pageSize: REPORT_PAGE_SIZE,
    }),
    listSmallGroups(),
    getMe(),
  ]);

  if (data.counts.all === 0 && !hasActiveFilters(filters)) {
    if (scoped && me.member === null) {
      return (
        <EmptyState icon={UserGroupIcon} title={t("notLinkedTitle")}>
          {t("notLinkedBody")}
        </EmptyState>
      );
    }

    if (scoped && me.leads.length === 0) {
      return (
        <EmptyState icon={UserGroupIcon} title={t("noGroupsTitle")}>
          {t("noGroupsBody")}
        </EmptyState>
      );
    }

    return (
      <EmptyState
        action={
          scoped ? undefined : (
            <NextLink
              className={buttonVariants({
                variant: "outline",
                className: "h-[42px] px-[18px] md:h-[42px]",
              })}
              href="/groups"
            >
              {t("viewGroups")}
            </NextLink>
          )
        }
        icon={ChartBarIcon}
        title={t("emptyTitle")}
      >
        {t("emptyBody")}
      </EmptyState>
    );
  }

  return (
    <ReportsBrowser
      canSubmit={canSubmit}
      clearFiltersLabel={t("clearFilters")}
      data={data}
      defaults={defaults}
      filters={filters}
      groups={groups.map(({ id, name, closedAt }) => ({
        id,
        name,
        closed: closedAt !== null,
      }))}
      noMatchesTitle={t("noMatchesTitle")}
      scoped={scoped}
    />
  );
}
