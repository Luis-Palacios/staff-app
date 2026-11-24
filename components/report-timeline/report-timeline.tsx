import type {
  PersonTimeline,
  TimelineEntry,
} from "@/api/small-groups-api/types";
import type { OpenGroups } from "@/lib/auth/permissions";

import { Fragment } from "react";

import { TimelineCareRow } from "./timeline-care-row";
import { TimelineMonth } from "./timeline-month";
import { TimelineRow, TimelineStatusRow } from "./timeline-row";

import { compareComingUp, isComingUp } from "@/lib/care-log-format";

/** Each kind of entry draws itself; a new kind is one more case here (inactive guests, rule 15). */
function Entry({
  entry,
  person,
  openGroups,
  compact,
  today,
}: {
  entry: TimelineEntry;
  person: PersonTimeline["person"];
  openGroups: OpenGroups;
  compact?: boolean;
  today?: string;
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
    case "careLog":
      return (
        <TimelineCareRow
          compact={compact}
          entry={entry.entry}
          person={person}
          today={today}
        />
      );
  }
}

function entryKey(entry: TimelineEntry, index: number): string {
  switch (entry.kind) {
    case "report":
      return `report-${entry.report.reportId}`;
    case "careLog":
      return `care-log-${entry.entry.id}`;
    default:
      return `status-${entry.date}-${index}`;
  }
}

function countKinds(entries: TimelineEntry[]) {
  return {
    reports: entries.filter(({ kind }) => kind === "report").length,
    care: entries.filter(({ kind }) => kind === "careLog").length,
  };
}

/**
 * A person's timeline (rules 21–22): entries grouped under month headings, with care log plans
 * still ahead first, under *Coming up*, whatever the date range (care spec rule 11). `preview` is
 * the Recent activity card's body: the same entries with no month headings and no *View report*.
 * `today` is set on the full timeline, which is where *Record how it went* and *Edit* live. The
 * header, filters and footer belong to the page around it.
 */
export function ReportTimeline({
  timeline,
  openGroups,
  variant = "full",
  today,
}: {
  timeline: Pick<PersonTimeline, "person" | "entries">;
  openGroups: OpenGroups;
  variant?: "full" | "preview";
  today?: string;
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

  // Plans after today sit above the months, soonest first.
  const ahead = (
    today
      ? entries.filter(
          (entry) => entry.kind === "careLog" && isComingUp(entry.entry, today),
        )
      : []
  ).sort((a, b) =>
    a.kind === "careLog" && b.kind === "careLog"
      ? compareComingUp(a.entry, b.entry)
      : 0,
  );
  const rest = entries.filter((entry) => !ahead.includes(entry));
  const months: { month: string; entries: TimelineEntry[] }[] = [];

  for (const entry of rest) {
    const key = entry.date.slice(0, 7);
    const last = months[months.length - 1];

    if (last && last.month === key) last.entries.push(entry);
    else months.push({ month: key, entries: [entry] });
  }

  return (
    <Fragment>
      {ahead.length > 0 && (
        <TimelineMonth ahead={ahead.length} month={`${today}`} reports={0}>
          {ahead.map((entry, index) => (
            <Entry
              key={entryKey(entry, index)}
              entry={entry}
              openGroups={openGroups}
              person={person}
              today={today}
            />
          ))}
        </TimelineMonth>
      )}
      {months.map(({ month, entries: monthEntries }) => (
        <TimelineMonth
          key={month}
          month={`${month}-01`}
          {...countKinds(monthEntries)}
        >
          {monthEntries.map((entry, index) => (
            <Entry
              key={entryKey(entry, index)}
              entry={entry}
              openGroups={openGroups}
              person={person}
              today={today}
            />
          ))}
        </TimelineMonth>
      ))}
    </Fragment>
  );
}
