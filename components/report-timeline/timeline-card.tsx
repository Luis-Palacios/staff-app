import type { PersonTimeline } from "@/api/small-groups-api/types";
import type { OpenGroups } from "@/lib/auth/permissions";
import type { TimelineQuery } from "@/lib/timeline-range";

import { useTranslations } from "next-intl";

import { TimelineBoard } from "./timeline-board";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { LogCareButton } from "@/components/care/log-care-button";
import { card } from "@/components/primitives";
import { firstNameOf } from "@/lib/report-items";

/** The Timeline tab's card: heading and description over the filterable board. */
export function TimelineCard({
  timeline,
  query,
  today,
  viewer,
  kind,
  firstVisitDate,
  openGroups,
  care,
  canLogCare,
}: {
  timeline: PersonTimeline;
  query: TimelineQuery;
  today: string;
  viewer: "elder" | "leader";
  kind: "member" | "guest";
  /** A guest's first visit, for the end line. */
  firstVisitDate?: string | null;
  /** The groups whose page and report the viewer can open. */
  openGroups: OpenGroups;
  /** `careLog: view`: care log entries and the *Care* chip. */
  care: boolean;
  /** `careLog: create`: the *Log care* button. */
  canLogCare: boolean;
}) {
  const t = useTranslations("ReportTimeline");
  const tCare = useTranslations("CareLog");
  const name = firstNameOf(timeline.person.name);

  return (
    <section
      aria-labelledby="timeline-title"
      className={card({ className: "flex min-w-0 flex-col" })}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3 px-6 pb-4 pt-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2 basis-[360px]">
          <DetailCardHeading
            eyebrow={care ? t("eyebrowCare") : t("eyebrow")}
            id="timeline-title"
          >
            {t("title")}
          </DetailCardHeading>
          <p className="max-w-[72ch] text-sm text-muted">
            {viewer === "elder"
              ? t("subElder", { name })
              : t("subLeader", { name })}
            {care && ` ${t("subCare")}`}
          </p>
        </div>
        {canLogCare && (
          <LogCareButton
            withIcon
            label={tCare("log")}
            people={[timeline.person]}
            today={today}
            variant="primary"
          />
        )}
      </div>
      <TimelineBoard
        care={care}
        firstVisitDate={firstVisitDate}
        groupId={query.groupId}
        kind={kind}
        openGroups={openGroups}
        range={query.range}
        timeline={timeline}
        today={today}
        viewer={viewer}
      />
    </section>
  );
}
