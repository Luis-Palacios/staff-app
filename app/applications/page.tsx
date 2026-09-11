import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

import ApplicationCardSummary from "./application-card-summary";
import ApplicationsSummaryTable from "./applications-summary-table";

import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";
import { applicationsBreadcrumb } from "@/config/breadcrumbs";

export default async function ApplicationsPage() {
  const response = await fetch("http://localhost:8000/applications/recents");
  const data = (await response.json()) as ApplicationMembershipSummary[];

  return (
    <>
      <StaffAppBreadcrumbs items={[applicationsBreadcrumb]} />
      <h2 className="mb-3 font-bold ml-2">Membership Applications</h2>
      <section className="flex flex-col gap-4">
        <div className="hidden md:inline-block text-center justify-center">
          <ApplicationsSummaryTable data={data} />
        </div>

        <div className="grid gap-3 md:hidden">
          {data.map((application) => (
            <ApplicationCardSummary
              key={application.applicationId}
              application={application}
            />
          ))}
        </div>
      </section>
    </>
  );
}
