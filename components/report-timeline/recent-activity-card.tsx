import type { PersonTimeline } from "@/api/small-groups-api/types";
import type { OpenGroups } from "@/lib/auth/permissions";

import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { ReportTimeline } from "./report-timeline";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { firstNameOf } from "@/lib/report-items";

/**
 * Recent activity on a Profile tab (rule 20): the 3 newest rows the viewer can see and a link to
 * the Timeline tab. Hidden when there are none. `viewer` picks the footer: elders see every
 * group, a leader only what rule 23 lets through.
 */
export function RecentActivityCard({
  timeline,
  timelineHref,
  viewer,
  openGroups,
}: {
  timeline: PersonTimeline;
  timelineHref: string;
  viewer: "elder" | "leader";
  openGroups: OpenGroups;
}) {
  const t = useTranslations("ReportTimeline");

  if (timeline.rows.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-activity"
      className={card({ className: "flex min-w-0 flex-col" })}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 px-6 pb-3 pt-5">
        <DetailCardHeading eyebrow={t("eyebrow")} id="recent-activity">
          {t("recent")}
        </DetailCardHeading>
        <NextLink
          className={textLink({ className: "text-sm" })}
          href={timelineHref}
        >
          {t("seeAll")}
        </NextLink>
      </div>
      <div className="border-t border-separator">
        <ReportTimeline
          openGroups={openGroups}
          timeline={timeline}
          variant="preview"
        />
      </div>
      <p className="border-t border-separator px-6 py-3.5 text-[13px] text-muted">
        {viewer === "elder"
          ? t("previewFootElder", { name: firstNameOf(timeline.person.name) })
          : t("previewFootLeader")}
      </p>
    </section>
  );
}
