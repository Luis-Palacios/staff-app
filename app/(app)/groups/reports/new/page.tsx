import { notFound, redirect } from "next/navigation";

import { ReportFlow } from "../_components/report-flow";
import {
  getReportRosterAction,
  listReportedDatesAction,
} from "../_actions/report-actions";
import { defaultMeetingDate } from "../_lib/meeting-dates";

import { getMe } from "@/api/members-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { getPermissions } from "@/lib/auth/get-permissions";
import { reportAccess } from "@/lib/auth/permissions";
import { getChurchToday } from "@/lib/church-time";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, me, permissions] = await Promise.all([
    searchParams,
    getMe(),
    getPermissions(),
  ]);
  const { access, canSubmit } = reportAccess(permissions, me);

  // Rule 5: no member (or no access to groups) means no report to file, so this page doesn't exist.
  if (!canSubmit) notFound();

  const groups = (await listSmallGroups()).filter(
    (group) => group.closedAt === null,
  );

  // Nothing to file for: the list's empty state explains why.
  if (groups.length === 0) redirect("/groups/reports");

  const requested = Number(first(params.groupId));
  // Without `?groupId=`, an elder or admin who leads a group starts on it (the first, if several).
  const ledGroup = me.leads
    .map(({ smallGroupId }) => groups.find(({ id }) => id === smallGroupId))
    .find((led) => led !== undefined);
  const group =
    groups.find(({ id }) => id === requested) ?? ledGroup ?? groups[0];
  const today = getChurchToday();
  const reported = await listReportedDatesAction(group.id, today);
  // A date with a no meeting is as taken as one with a report when picking where to start.
  const takenDates = new Set([...reported.filed, ...reported.noMeeting]);
  const requestedDate = first(params.date);
  // `?date=` comes from "File report" on a not-filed row; a future or malformed one is ignored.
  const date =
    requestedDate && DATE_PATTERN.test(requestedDate) && requestedDate <= today
      ? requestedDate
      : defaultMeetingDate({
          today,
          meetingDay: group.meetingDay,
          filedDates: takenDates,
        });
  const rosterResult = await getReportRosterAction(group.id, date);

  return (
    <ReportFlow
      groups={groups.map(({ id, name, meetingDay, meetingAddress }) => ({
        id,
        name,
        meetingDay,
        meetingAddress,
      }))}
      initialDate={date}
      initialDates={reported}
      initialGroupId={group.id}
      initialRoster={
        rosterResult.ok
          ? {
              status: "ready",
              roster: rosterResult.roster,
              existsMessage: rosterResult.existsMessage,
              noMeetingReason: rosterResult.noMeetingReason,
            }
          : null
      }
      scoped={access === "scoped"}
      today={today}
    />
  );
}
