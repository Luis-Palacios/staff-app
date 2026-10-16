import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { ApplicationDetailHeader } from "./_components/application-detail-header";
import { DetailCardHeading } from "./_components/detail-card-heading";
import { TestimonyCard } from "./_components/testimony-card";

import { getApplicationDetail } from "@/api/applications-membership-api/client";
import { card } from "@/components/primitives";
import PersonTimeline from "@/components/person_timeline";
import PersonTimelineSkeleton from "@/components/person_timeline/skeleton";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission({ membershipApplications: ["view"] });

  const { id } = await params;
  const t = await getTranslations("ApplicationDetailPage");

  const application = await getApplicationDetail(id);

  return (
    <>
      <ApplicationDetailHeader application={application} />
      <div className="flex flex-wrap items-start gap-5">
        <TestimonyCard
          conversion={application.conversion}
          lifeAfter={application.lifeAfter}
          lifeBefore={application.lifeBefore}
        />
        <section
          className={card({
            className:
              "flex min-w-0 flex-[2_1_340px] flex-col gap-[18px] px-6 pb-6 pt-5",
          })}
        >
          <DetailCardHeading eyebrow={t("timelineEyebrow")}>
            {t("timelineTitle")}
          </DetailCardHeading>
          <Suspense fallback={<PersonTimelineSkeleton />}>
            <PersonTimeline personId={application.personId} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
