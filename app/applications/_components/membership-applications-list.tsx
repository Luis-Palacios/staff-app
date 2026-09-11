import ApplicationCardSummary from "./application-card-summary";
import ApplicationsSummaryTable from "./applications-summary-table";

import { getRecentApplications } from "@/api/applications-membership-api/client";

export default async function MembershipApplicationsList() {
  const data = await getRecentApplications();

  return (
    <>
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
    </>
  );
}
