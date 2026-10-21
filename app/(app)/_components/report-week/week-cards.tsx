import type { WeekLabels } from "./week-table";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";

import {
  type WeekRowView,
  WeekAttendance,
  WeekGroupCell,
  WeekObservations,
  WeekStatusCell,
} from "./week-rows";

import { card } from "@/components/primitives";

/** The week as cards, below `xl`. */
export function WeekCards({ rows, t }: { rows: WeekRowView[]; t: WeekLabels }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-3 xl:hidden">
      {rows.map((item) => (
        <li
          key={item.id}
          className={card({ className: "flex flex-col overflow-hidden" })}
        >
          <div className="flex flex-1 flex-col gap-3 px-[18px] py-4">
            <div className="flex items-start justify-between gap-2.5">
              <WeekGroupCell noLeader={t.noLeader} row={item} />
              <WeekStatusCell wrapReason row={item} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm tabular-nums">
              <div className="flex flex-col gap-1">
                <dt className="text-[12.5px] font-semibold text-muted">
                  {t.colAttendance}
                </dt>
                <dd className="m-0">
                  <WeekAttendance row={item} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[12.5px] font-semibold text-muted">
                  {t.colObservations}
                </dt>
                <dd className="m-0">
                  <WeekObservations row={item} />
                </dd>
              </div>
            </dl>
          </div>
          <NextLink
            aria-label={item.action.ariaLabel}
            className="flex min-h-11 items-center justify-between gap-2 border-t border-separator bg-surface-secondary/50 px-[18px] text-sm font-semibold text-heading transition-colors hover:bg-surface-secondary"
            href={item.action.href}
          >
            {item.action.label}
            <ChevronRightIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </NextLink>
        </li>
      ))}
    </ul>
  );
}
