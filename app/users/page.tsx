import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";

export default async function UsersPage() {
  return (
    <>
      <StaffAppPageHeader breadcrumbs={[usersBreadcrumb]} title="Users" />
      <section className="flex flex-col gap-4">
        <p>List of users will be displayed here.</p>
      </section>
    </>
  );
}
