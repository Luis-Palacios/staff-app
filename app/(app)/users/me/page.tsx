import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";

export default async function MyProfilePage() {
  // TODO: Get current user login id and fetch user profile data
  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          usersBreadcrumb,
          { label: "My Profile", href: "/users/me" },
        ]}
        title="User Profile"
      />
    </>
  );
}
