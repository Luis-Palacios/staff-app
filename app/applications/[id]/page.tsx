import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";

export default async function ApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return (
    <div>
      <StaffAppPageHeader
        breadcrumbs={[
          applicationsBreadcrumb,
          { label: id, href: `/applications/${id}` },
        ]}
        title={`Application ID: ${id}`}
      />
    </div>
  );
}
