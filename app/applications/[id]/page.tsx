import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";

export default async function ApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return (
    <div>
      <StaffAppBreadcrumbs
        items={[
          applicationsBreadcrumb,
          { label: id, href: `/applications/${id}` },
        ]}
      />
      <h1>Application ID: {id}</h1>
    </div>
  );
}
