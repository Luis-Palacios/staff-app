import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { title } from "@/components/primitives";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";

export default function GroupsPage() {
  return (
    <>
      <StaffAppBreadcrumbs items={[groupsBreadcrumb]} />
      <h2 className="mb-3 font-bold ml-2">Groups</h2>
      <section className="flex flex-col gap-4">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Groups</h1>
        </div>
      </section>
    </>
  );
}
