import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";

export default function GroupsPage() {
  return (
    <>
      <StaffAppPageHeader breadcrumbs={[groupsBreadcrumb]} title="Groups" />
      <section className="flex flex-col gap-4">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Groups</h1>
        </div>
      </section>
    </>
  );
}
