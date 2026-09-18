import { headers } from "next/headers";

import InviteCardSummary from "./invite-card-summary";
import InvitesSummaryTable from "./invites-summary-table";

import { listInvites } from "@/api/auth-api/client";

export default async function InvitesList({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const cookie = (await headers()).get("cookie") ?? "";
  const { invites } = await listInvites(cookie);

  return (
    <>
      <div className="hidden md:inline-block text-center justify-center">
        <InvitesSummaryTable currentUserId={currentUserId} data={invites} />
      </div>

      <div className="grid gap-3 md:hidden">
        {invites.map((invite) => (
          <InviteCardSummary
            key={invite.id}
            currentUserId={currentUserId}
            invite={invite}
          />
        ))}
      </div>
    </>
  );
}
