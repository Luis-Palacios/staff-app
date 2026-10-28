import type { PersonTimeline } from "@/api/small-groups-api/types";
import type { OpenGroups } from "@/lib/auth/permissions";

import { Fragment } from "react";

import { TimelineMonth } from "./timeline-month";
import { TimelineRow } from "./timeline-row";

/**
 * A person's report timeline (rules 21–22): rows grouped under month headings. `preview` is the
 * Recent activity card's body: the same rows with no month headings and no *View report*. The
 * header, filters and footer belong to the page around it (stages 7–8).
 */
export function ReportTimeline({
  timeline,
  openGroups,
  variant = "full",
}: {
  timeline: Pick<PersonTimeline, "person" | "rows">;
  openGroups: OpenGroups;
  variant?: "full" | "preview";
}) {
  const { person, rows } = timeline;

  if (variant === "preview") {
    return (
      <ol className="flex flex-col">
        {rows.map((row) => (
          <TimelineRow
            key={row.reportId}
            compact
            openGroups={openGroups}
            person={person}
            row={row}
          />
        ))}
      </ol>
    );
  }

  const months: { month: string; rows: typeof rows }[] = [];

  for (const row of rows) {
    const key = row.meetingDate.slice(0, 7);
    const last = months[months.length - 1];

    if (last && last.month === key) last.rows.push(row);
    else months.push({ month: key, rows: [row] });
  }

  return (
    <Fragment>
      {months.map(({ month, rows: monthRows }) => (
        <TimelineMonth
          key={month}
          count={monthRows.length}
          month={`${month}-01`}
        >
          {monthRows.map((row) => (
            <TimelineRow
              key={row.reportId}
              openGroups={openGroups}
              person={person}
              row={row}
            />
          ))}
        </TimelineMonth>
      ))}
    </Fragment>
  );
}
