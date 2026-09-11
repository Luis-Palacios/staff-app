import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import { title } from "@/components/primitives";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";

export default function ReportsPage() {
  return (
    <>
      <StaffAppBreadcrumbs
        items={[groupsBreadcrumb, groupsReportsBreadcrumb]}
      />
      <h2 className="mb-3 font-bold ml-2">Reports</h2>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Reports</h1>
        </div>
      </section>
    </>
  );
}
