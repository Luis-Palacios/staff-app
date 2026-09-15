import { redirect } from "next/navigation";

import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getServerSession } from "@/lib/get-session";
import { canView, parseRole } from "@/lib/permissions";

export default async function GroupsPage() {
  const session = await getServerSession();
  const role = parseRole(session?.user.role);

  if (!canView(role, "smallGroups")) {
    redirect("/");
  }

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
