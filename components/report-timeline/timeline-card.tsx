import type { PersonTimeline } from "@/api/small-groups-api/types";

import { ClockIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { ReportTimeline } from "./report-timeline";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { EmptyState } from "@/components/empty-state";
import { card } from "@/components/primitives";
import { firstNameOf } from "@/lib/report-items";

/** The Timeline tab's card: heading and description, the rows by month, the audience note. */
export function TimelineCard({
  timeline,
  viewer,
}: {
  timeline: PersonTimeline;
  viewer: "elder" | "leader";
}) {
  const t = useTranslations("ReportTimeline");
  const name = firstNameOf(timeline.person.name);

  return (
    <section
      aria-labelledby="timeline-title"
      className={card({ className: "flex min-w-0 flex-col" })}
    >
      <div className="flex flex-col gap-2 px-6 pb-4 pt-5">
        <DetailCardHeading eyebrow={t("eyebrow")} id="timeline-title">
          {t("title")}
        </DetailCardHeading>
        <p className="max-w-[72ch] text-sm text-muted">
          {viewer === "elder"
            ? t("subElder", { name })
            : t("subLeader", { name })}
        </p>
      </div>
      {timeline.rows.length === 0 ? (
        <div className="border-t border-separator px-6 py-8">
          <EmptyState as="h3" icon={ClockIcon} title={t("emptyTitle")}>
            {t("emptyBody")}
          </EmptyState>
        </div>
      ) : (
        <div className="border-t border-separator">
          <ReportTimeline timeline={timeline} />
        </div>
      )}
      <p className="border-t border-separator px-6 py-3.5 text-[13px] text-muted">
        {viewer === "elder"
          ? t("footElder", { name })
          : t("footLeader", { name })}
      </p>
    </section>
  );
}
