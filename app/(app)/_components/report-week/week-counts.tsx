import type { ReactNode } from "react";
import type { ReportWeek } from "@/api/small-groups-api/types";

import { getTranslations } from "next-intl/server";

import {
  WEEK_STATUS_BADGE,
  WEEK_STATUS_ORDER,
  weekStatusKey,
} from "./week-status";

import { StatusBadge } from "@/components/status-badge";

/** One pill per status that has groups, in rule 8's order. */
export async function WeekCounts({ week }: { week: ReportWeek }) {
  const t = await getTranslations("GroupsDashboard");
  const strong = (chunks: ReactNode) => (
    <strong className="font-bold tabular-nums">{chunks}</strong>
  );

  return (
    <ul aria-label={t("weekSummary")} className="m-0 flex flex-wrap gap-2 p-0">
      {WEEK_STATUS_ORDER.map((status) => {
        const count = week.groups.filter(
          (group) => group.status === status,
        ).length;

        if (count === 0) return null;

        const key = weekStatusKey(status, week.isCurrentWeek);

        return (
          <li key={status} className="list-none">
            <StatusBadge
              className="h-8 gap-[7px] pl-2.5 pr-3 text-[13.5px] font-normal"
              {...WEEK_STATUS_BADGE[status]}
            >
              {t.rich(`count.${key}`, { count, strong })}
            </StatusBadge>
          </li>
        );
      })}
    </ul>
  );
}
