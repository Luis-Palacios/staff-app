import type {
  PersonTimeline,
  TimelineEntry,
} from "@/api/small-groups-api/types";
import type { OpenGroups } from "@/lib/auth/permissions";

import { Fragment } from "react";

import { TimelineMonth } from "./timeline-month";
import { TimelineRow, TimelineStatusRow } from "./timeline-row";

/** Each kind of entry draws itself; a new kind is one more case here (inactive guests, rule 15). */
function Entry({
  entry,
  person,
  openGroups,
  compact,
}: {
  entry: TimelineEntry;
  person: PersonTimeline["person"];
  openGroups: OpenGroups;
  compact?: boolean;
}) {
  switch (entry.kind) {
    case "report":
      return (
        <TimelineRow
          compact={compact}
          openGroups={openGroups}
          person={person}
          row={entry.report}
        />
      );
    case "status":
      return (
        <TimelineStatusRow compact={compact} entry={entry} person={person} />
      );
  }
}

function entryKey(entry: TimelineEntry, index: number): string {
  return entry.kind === "report"
    ? `report-${entry.report.reportId}`
    : `status-${entry.date}-${index}`;
}

/**
 * A person's timeline (rules 21–22): entries grouped under month headings. `preview` is the Recent
 * activity card's body: the same entries with no month headings and no *View report*. The header,
 * filters and footer belong to the page around it (stages 7–8).
 */
export function ReportTimeline({
  timeline,
  openGroups,
  variant = "full",
}: {
  timeline: Pick<PersonTimeline, "person" | "entries">;
  openGroups: OpenGroups;
  variant?: "full" | "preview";
}) {
  const { person, entries } = timeline;

  if (variant === "preview") {
    return (
      <ol className="flex flex-col">
        {entries.map((entry, index) => (
          <Entry
            key={entryKey(entry, index)}
            compact
            entry={entry}
            openGroups={openGroups}
            person={person}
          />
        ))}
      </ol>
    );
  }

  const months: { month: string; entries: TimelineEntry[] }[] = [];

  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const last = months[months.length - 1];

    if (last && last.month === key) last.entries.push(entry);
    else months.push({ month: key, entries: [entry] });
  }

  return (
    <Fragment>
      {months.map(({ month, entries: monthEntries }) => (
        <TimelineMonth
          key={month}
          count={monthEntries.filter(({ kind }) => kind === "report").length}
          month={`${month}-01`}
        >
          {monthEntries.map((entry, index) => (
            <Entry
              key={entryKey(entry, index)}
              entry={entry}
              openGroups={openGroups}
              person={person}
            />
          ))}
        </TimelineMonth>
      ))}
    </Fragment>
  );
}
