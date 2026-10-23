import { getTranslations } from "next-intl/server";

import { GuestForm } from "../../_components/guest-form";
import { loadGuest } from "../../_lib/load-guest";
import { requireGuests } from "../../_lib/require-guests";

import { getMe } from "@/api/members-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb, guestsBreadcrumb } from "@/config/breadcrumbs";
import { getChurchToday } from "@/lib/church-time";
import { getPermissions } from "@/lib/auth/get-permissions";
import { can, getSmallGroupAccess } from "@/lib/auth/permissions";

export default async function EditGuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireGuests({ guests: ["update"] });

  const { id } = await params;
  const [guest, t, permissions, me] = await Promise.all([
    loadGuest(id),
    getTranslations("GuestFormPage"),
    getPermissions(),
    getMe(),
  ]);
  const canList = can(permissions, { guests: ["view", "all"] });
  const ledIds = new Set(me.leads.map((lead) => lead.smallGroupId));
  const group = guest.currentGroup;
  // A leader has no Guests list: the trail goes through their group, when they can open it.
  const groupCrumb =
    !canList &&
    group &&
    (getSmallGroupAccess(permissions) === "full" || ledIds.has(group.id))
      ? [groupsBreadcrumb, { label: group.name, href: `/groups/${group.id}` }]
      : [];
  const firstName = guest.name.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          ...(canList ? [guestsBreadcrumb] : groupCrumb),
          { label: guest.name, href: `/guests/${id}` },
          { label: t("editCrumb"), href: `/guests/${id}/edit` },
        ]}
        description={t("editDescription", { firstName })}
        title={t("editTitle")}
      />
      <GuestForm
        canOpenGuests={canList}
        cancelHref={`/guests/${id}`}
        guestId={id}
        initial={{
          name: guest.name,
          email: guest.email ?? "",
          phone: guest.phone ?? "",
          address: guest.address ?? "",
          sex: guest.sex ?? "",
          firstVisitDate: guest.firstVisitDate ?? "",
        }}
        initialInvitedBy={guest.invitedBy}
        today={getChurchToday()}
      />
    </>
  );
}
