import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { ApiError } from "@/api/api-client";
import { listCareLogEntries } from "@/api/care-log-api/client";
import { getMe } from "@/api/members-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { CareCalendar } from "@/components/care/care-calendar";
import { LogCareButton } from "@/components/care/log-care-button";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getPermissions, requirePermission } from "@/lib/auth/get-permissions";
import { can } from "@/lib/auth/permissions";
import { monthBounds, parseCalendarQuery } from "@/lib/care-calendar";
import { getChurchToday } from "@/lib/church-time";
import { settle } from "@/lib/settle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CareCalendar");

  return { title: t("title") };
}

/**
 * The care calendar (care spec rules 50–55): the care log entries the viewer can see, by month or
 * as an agenda. Everything the view needs is in the URL (`?view=&month=&filter=&group=&kind=`),
 * so a link or a reload keeps it; the month's entries are read here, by one `GET /care-log` over
 * the month (rule 53).
 */
export default async function CareCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission({ careLog: ["view"] });

  const [search, permissions, me, t, log] = await Promise.all([
    searchParams,
    getPermissions(),
    getMe(),
    getTranslations("CareCalendar"),
    getTranslations("CareLog"),
  ]);
  const today = getChurchToday();
  const query = parseCalendarQuery(search, today);
  const { from, to } = monthBounds(query.month);
  const isElder = can(permissions, { careLog: ["all"] });
  const canWrite = can(permissions, { careLog: ["create"] });
  // Any group for `careLog: all`, otherwise the groups the viewer leads (rule 52).
  const groups = isElder
    ? await settle(listSmallGroups()).then((result) =>
        result.ok
          ? result.value
              .filter((group) => group.closedAt === null)
              .map(({ id, name }) => ({ id, name }))
          : null,
      )
    : me.leads.map((lead) => ({ id: lead.smallGroupId, name: lead.name }));
  const params = {
    from,
    to,
    mine: query.filter === "mine",
    kind: query.kinds,
  };
  // A group in the URL that is unknown or out of reach is a 404 from the API: show the calendar
  // for all of them rather than an error page.
  const knownGroup =
    query.groupId !== null &&
    (groups?.some((g) => g.id === query.groupId) ?? true)
      ? query.groupId
      : null;
  // The group the list is really filtered by: null again when the API refused it.
  let shownGroup = knownGroup;
  const entries = await listCareLogEntries({
    ...params,
    groupId: knownGroup ?? undefined,
  }).catch((error: unknown) => {
    if (
      knownGroup !== null &&
      error instanceof ApiError &&
      error.status === 404
    ) {
      shownGroup = null;

      return listCareLogEntries(params);
    }

    throw error;
  });

  return (
    <>
      <StaffAppPageHeader
        actions={
          canWrite && (
            <LogCareButton
              withIcon
              label={log("log")}
              today={today}
              variant="primary"
            />
          )
        }
        description={t("sub")}
        eyebrow={log("eyebrow")}
        title={t("title")}
      />
      <CareCalendar
        canWrite={canWrite}
        entries={entries}
        groups={groups}
        isElder={isElder}
        query={{ ...query, groupId: shownGroup }}
        today={today}
        viewerMemberId={me.member?.id ?? null}
      />
    </>
  );
}
