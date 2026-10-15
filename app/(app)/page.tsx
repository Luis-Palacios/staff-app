import { Suspense } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AddMemberLink } from "./members/_components/add-member-link";
import { InviteStaffLink } from "./users/_components/invite-staff-link";
import { deriveInviteStatus } from "./users/invites/_components/invite-status-chips";
import { Greeting, TodayDate } from "./_components/dashboard-greeting";
import {
  NeedsAttentionCard,
  NeedsAttentionCardSkeleton,
} from "./_components/needs-attention-card";
import { NoGroupsCard } from "./_components/no-groups-card";
import { RecentApplicationsCard } from "./_components/recent-applications-card";
import { StatTile } from "./_components/stat-tile";

import {
  getRecentApplications,
  getRecentApplicationsCount,
} from "@/api/applications-membership-api/client";
import { listInvites, listUsers } from "@/api/auth-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { AuthRole, STAFF_ADMIN_ROLES } from "@/lib/auth/roles";
import { mapSettled, settle } from "@/lib/settle";

export default async function DashboardPage() {
  const [session, t] = await Promise.all([
    getServerSession(),
    getTranslations("DashboardPage"),
  ]);

  // The (app) layout already redirects without a session; this narrows the type.
  if (!session) {
    redirect("/sign-in");
  }

  // TEMPORARY: same hardcoded admin/elder check as the users and invites pages,
  // because listUsers and listInvites 403 for every other role. Replace it with
  // the Phase 9 role→permission model.
  const isStaffAdmin = STAFF_ADMIN_ROLES.includes(session.user.role);
  const firstName = session.user.name.trim().split(/\s+/)[0] ?? "";

  // Start every fetch now and await none of them here, so they run in
  // parallel. Each section awaits its own promise inside a Suspense boundary,
  // and sections that need the same data share one promise (one request).
  // settle() turns a failed fetch into { ok: false }, so a failing service
  // shows an error in its own section instead of reaching app/error.tsx.
  const applications = settle(getRecentApplications());
  const awaitingFulfilment = mapSettled(
    applications,
    (list) => list.filter((application) => !application.isFulfilled).length,
  );

  const groups = settle(listSmallGroups());
  let pendingUsers = null;
  let openInvites = null;

  if (isStaffAdmin) {
    const cookie = (await headers()).get("cookie") ?? "";

    pendingUsers = settle(
      listUsers(cookie).then(({ users }) =>
        users.filter((user) => user.role === AuthRole.Pending),
      ),
    );
    openInvites = settle(
      listInvites(cookie).then(({ invites }) =>
        invites.filter((invite) => deriveInviteStatus(invite) === "pending"),
      ),
    );
  }

  return (
    <>
      <StaffAppPageHeader
        actions={
          <>
            <AddMemberLink variant="outline" />
            {isStaffAdmin && <InviteStaffLink />}
          </>
        }
        description={t("description")}
        eyebrow={<TodayDate />}
        title={
          <Greeting
            firstName={firstName}
            salutations={{
              morning: t("morning"),
              afternoon: t("afternoon"),
              evening: t("evening"),
            }}
          />
        }
      />

      <div className="flex flex-col gap-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(210px,1fr))] sm:gap-4">
          <StatTile
            href="/applications"
            icon={DocumentTextIcon}
            label={t("newApplications")}
            sub={t("newApplicationsSub")}
            value={settle(getRecentApplicationsCount())}
          />
          <StatTile
            attention
            href="/applications?status=pending"
            icon={ClockIcon}
            label={t("awaitingFulfilment")}
            sub={t("awaitingFulfilmentSub")}
            value={awaitingFulfilment}
          />
          {pendingUsers && openInvites && (
            <>
              <StatTile
                attention
                href="/users"
                icon={UserIcon}
                label={t("waitingForRole")}
                sub={t("waitingForRoleSub")}
                value={mapSettled(pendingUsers, (users) => users.length)}
              />
              <StatTile
                href="/users/invites"
                icon={EnvelopeIcon}
                label={t("openInvites")}
                sub={t("openInvitesSub")}
                value={mapSettled(openInvites, (invites) => invites.length)}
              />
            </>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-5">
          <RecentApplicationsCard applications={applications} />

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            {pendingUsers && openInvites && (
              <Suspense fallback={<NeedsAttentionCardSkeleton />}>
                <NeedsAttentionCard
                  openInvites={openInvites}
                  pendingUsers={pendingUsers}
                />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <NoGroupsCard groups={groups} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
