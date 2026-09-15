import { redirect } from "next/navigation";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { getServerSession } from "@/lib/get-session";
import { canView, parseRole } from "@/lib/permissions";

export default async function UsersPage() {
  const session = await getServerSession();
  const role = parseRole(session?.user.role);

  if (!canView(role, "userAccounts")) {
    redirect("/");
  }

  return (
    <>
      <StaffAppPageHeader breadcrumbs={[usersBreadcrumb]} title="Users" />
      <section className="flex flex-col gap-4">
        <p>List of users will be displayed here.</p>
      </section>
    </>
  );
}
