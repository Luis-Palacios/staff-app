import type { GuestStatusFilter } from "@/api/guests-api/types";

import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AddGuestLink } from "./_components/add-guest-link";
import GuestsList from "./_components/guests-list";
import GuestsListSkeleton from "./_components/guests-list-skeleton";
import { requireGuests } from "./_lib/require-guests";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { guestsBreadcrumb } from "@/config/breadcrumbs";
import { hasPermission } from "@/lib/auth/get-permissions";

const STATUSES: readonly GuestStatusFilter[] = ["active", "inactive", "all"];

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireGuests({ guests: ["view", "all"] });

  const [{ status, q, page }, t, canCreate] = await Promise.all([
    searchParams,
    getTranslations("GuestsPage"),
    hasPermission({ guests: ["create", "all"] }),
  ]);
  const parsedPage = Number(page);

  return (
    <>
      <StaffAppPageHeader
        actions={canCreate ? <AddGuestLink variant="primary" /> : undefined}
        breadcrumbs={[guestsBreadcrumb]}
        description={t("description")}
        title={t("title")}
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<GuestsListSkeleton />}>
          <GuestsList
            canCreate={canCreate}
            page={
              Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
            }
            q={q?.trim() ?? ""}
            status={STATUSES.find((s) => s === status) ?? "active"}
          />
        </Suspense>
      </section>
    </>
  );
}
