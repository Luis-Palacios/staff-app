import ApplicationCardSummary from "./application-card-summary";
import ApplicationsSummaryTable from "./applications-summary-table";

import { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

export default async function MembershipApplicationsList() {
  const response = await fetch("http://localhost:8000/applications/recents");
  const data = (await response.json()) as ApplicationMembershipSummary[];

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
