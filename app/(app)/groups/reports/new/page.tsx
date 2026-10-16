import { notFound, redirect } from "next/navigation";

import { ReportFlow } from "../_components/report-flow";
import {
  getReportRosterAction,
  listFiledDatesAction,
} from "../_actions/report-actions";
import { defaultMeetingDate } from "../_lib/meeting-dates";

import { getMe } from "@/api/members-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { reportAccess } from "@/lib/auth/roles";
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
  const [params, me] = await Promise.all([searchParams, getMe()]);
  const { access, canSubmit } = reportAccess(me.role, me);

  // Rule 5: no member (or no access to groups) means no report to file, so this page doesn't exist.
  if (!canSubmit) notFound();

  const groups = (await listSmallGroups()).filter(
    (group) => group.closedAt === null,
  );

  // Nothing to file for: the list's empty state explains why.
  if (groups.length === 0) redirect("/groups/reports");

  const requested = Number(first(params.groupId));
  const group = groups.find(({ id }) => id === requested) ?? groups[0];
  const today = getChurchToday();
  const filedDates = new Set(await listFiledDatesAction(group.id, today));
  const requestedDate = first(params.date);
  // `?date=` comes from "File report" on a not-filed row; a future or malformed one is ignored.
  const date =
    requestedDate && DATE_PATTERN.test(requestedDate) && requestedDate <= today
      ? requestedDate
      : defaultMeetingDate({
          today,
          meetingDay: group.meetingDay,
          filedDates,
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
      initialFiledDates={[...filedDates]}
      initialGroupId={group.id}
      initialRoster={
        rosterResult.ok
          ? {
              status: "ready",
              roster: rosterResult.roster,
              existsMessage: rosterResult.existsMessage,
            }
          : null
      }
      scoped={access === "scoped"}
      today={today}
    />
  );
}
