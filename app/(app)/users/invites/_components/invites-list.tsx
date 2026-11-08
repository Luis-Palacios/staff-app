import { headers } from "next/headers";

import InvitesBrowser from "./invites-browser";

import { listInvites } from "@/api/auth-api/client";

export default async function InvitesList({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const cookie = (await headers()).get("cookie") ?? "";
  const { invites } = await listInvites(cookie);

  return <InvitesBrowser currentUserId={currentUserId} invites={invites} />;
}
