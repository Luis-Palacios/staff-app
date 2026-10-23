import { getTranslations } from "next-intl/server";

import { GuestForm } from "../_components/guest-form";
import { requireGuests } from "../_lib/require-guests";

import { listSmallGroups } from "@/api/small-groups-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { guestsBreadcrumb } from "@/config/breadcrumbs";
import { getChurchToday } from "@/lib/church-time";
import { hasPermission } from "@/lib/auth/get-permissions";

export default async function NewGuestPage() {
  await requireGuests({ guests: ["create", "all"] });

  const [t, tLink, canManage] = await Promise.all([
    getTranslations("GuestFormPage"),
    getTranslations("AddGuestLink"),
    hasPermission({ smallGroups: ["manageMembers"] }),
  ]);
  // Open guest groups only; the select is optional and needs `smallGroups: manageMembers`.
  const groups = canManage
    ? (await listSmallGroups().catch(() => []))
        .filter((group) => group.audience === "guests" && !group.closedAt)
        .map(({ id, name }) => ({ id, name }))
    : [];

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          guestsBreadcrumb,
          { label: tLink("label"), href: "/guests/new" },
        ]}
        description={t("newDescription")}
        title={t("newTitle")}
      />
      <GuestForm
        canOpenGuests
        cancelHref="/guests"
        groups={groups}
        today={getChurchToday()}
      />
    </>
  );
}
