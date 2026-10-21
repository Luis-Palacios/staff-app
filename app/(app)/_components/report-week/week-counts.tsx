import type { ReactNode } from "react";
import type {
  ReportWeek,
  ReportWeekStatus,
} from "@/api/small-groups-api/types";

import { getTranslations } from "next-intl/server";

import {
  type WeekBadgeStyle,
  WEEK_STATUS_BADGE,
  WEEK_STATUS_ORDER,
  weekStatusKey,
} from "./week-status";

export interface WeekPill {
  status: ReportWeekStatus;
  badge: WeekBadgeStyle;
  label: ReactNode;
}

/** One pill per status that has groups, in rule 8's order. The browser makes them filters. */
export async function buildWeekPills(week: ReportWeek): Promise<WeekPill[]> {
  const t = await getTranslations("GroupsDashboard");
  const strong = (chunks: ReactNode) => (
    <strong className="font-bold tabular-nums">{chunks}</strong>
  );

  return WEEK_STATUS_ORDER.flatMap((status) => {
    const count = week.groups.filter((group) => group.status === status).length;

    if (count === 0) return [];

    const key = weekStatusKey(status, week.isCurrentWeek);

    return [
      {
        status,
        badge: WEEK_STATUS_BADGE[status],
        label: t.rich(`count.${key}`, { count, strong }),
      },
    ];
  });
}
