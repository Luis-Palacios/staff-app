import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";

export default function GroupsPage() {
  const t = useTranslations("GroupsPage");
  const tNav = useTranslations("Nav");

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[groupsBreadcrumb]}
        title={tNav("groups")}
      />
      <EmptyState icon={UserGroupIcon} title={t("emptyTitle")}>
        {t("emptyBody")}
      </EmptyState>
    </>
  );
}
