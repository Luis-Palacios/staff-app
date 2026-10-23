import { Suspense } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { AddMemberLink } from "../members/_components/add-member-link";
import { InviteStaffLink } from "../users/_components/invite-staff-link";
import { deriveInviteStatus } from "../users/invites/_components/invite-status-chips";

import { Greeting, TodayDate } from "./dashboard-greeting";
import {
  NeedsAttentionCard,
  NeedsAttentionCardSkeleton,
} from "./needs-attention-card";
import { RecentApplicationsCard } from "./recent-applications-card";
import { StatTile } from "./stat-tile";

import {
  getRecentApplications,
  getRecentApplicationsCount,
} from "@/api/applications-membership-api/client";
import { listInvites, listUsers } from "@/api/auth-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { can } from "@/lib/auth/permissions";
import { getPermissions } from "@/lib/auth/get-permissions";
import { AuthRole } from "@/lib/auth/roles";
import { mapSettled, settle } from "@/lib/settle";

/**
 * The staff dashboard: applications, users and invites. Dashboard ▸ Applications & access for
 * full roles (`/dashboard/staff`) and the only dashboard for roles with no small group access
 * (`/`).
 */
export async function StaffDashboard({ firstName }: { firstName: string }) {
  const t = await getTranslations("DashboardPage");

  // Each section needs the permission of its own data (rule 7); a missing one drops the section,
  // not the page.
  const permissions = await getPermissions();
  const canApplications = can(permissions, {
    membershipApplications: ["view"],
  });
  const canUsers = can(permissions, { user: ["list"] });
  const canInvites = can(permissions, { invites: ["create"] });
  // Start every fetch now and await none of them here, so they run in
  // parallel. Each section awaits its own promise inside a Suspense boundary,
  // and sections that need the same data share one promise (one request).
  // settle() turns a failed fetch into { ok: false }, so a failing service
  // shows an error in its own section instead of reaching app/error.tsx.
  const applications = canApplications ? settle(getRecentApplications()) : null;
  const awaitingFulfilment = applications
    ? mapSettled(
        applications,
        (list) => list.filter((application) => !application.isFulfilled).length,
      )
    : null;
  const cookie =
    canUsers || canInvites ? ((await headers()).get("cookie") ?? "") : "";
  const pendingUsers = canUsers
    ? settle(
        listUsers(cookie).then(({ users }) =>
          users.filter((user) => user.role === AuthRole.Pending),
        ),
      )
    : null;
  const openInvites = canInvites
    ? settle(
        listInvites(cookie).then(({ invites }) =>
          invites.filter((invite) => deriveInviteStatus(invite) === "pending"),
        ),
      )
    : null;

  return (
    <>
      <StaffAppPageHeader
        actions={
          <>
            {can(permissions, { members: ["create"] }) && (
              <AddMemberLink variant="outline" />
            )}
            {canInvites && <InviteStaffLink />}
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
          {applications && awaitingFulfilment && (
            <>
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
            </>
          )}
          {pendingUsers && (
            <StatTile
              attention
              href="/users"
              icon={UserIcon}
              label={t("waitingForRole")}
              sub={t("waitingForRoleSub")}
              value={mapSettled(pendingUsers, (users) => users.length)}
            />
          )}
          {openInvites && (
            <StatTile
              href="/users/invites"
              icon={EnvelopeIcon}
              label={t("openInvites")}
              sub={t("openInvitesSub")}
              value={mapSettled(openInvites, (invites) => invites.length)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-start gap-5">
          {applications && (
            <RecentApplicationsCard applications={applications} />
          )}

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            {(pendingUsers || openInvites) && (
              <Suspense fallback={<NeedsAttentionCardSkeleton />}>
                <NeedsAttentionCard
                  openInvites={openInvites}
                  pendingUsers={pendingUsers}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
