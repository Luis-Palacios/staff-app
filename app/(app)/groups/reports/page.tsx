import { redirect } from "next/navigation";

import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import { title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getServerSession } from "@/lib/get-session";
import { canView, parseRole } from "@/lib/permissions";

export default async function ReportsPage() {
  const session = await getServerSession();
  const role = parseRole(session?.user.role);

  if (!canView(role, "smallGroupsReport")) {
    redirect("/");
  }

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[groupsBreadcrumb, groupsReportsBreadcrumb]}
        title="Reports"
      />
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Reports</h1>
        </div>
      </section>
    </>
  );
}
