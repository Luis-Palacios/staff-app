import { AcceptInviteClient } from "./_components/accept-invite-client";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  return <AcceptInviteClient email={email ?? null} token={token ?? null} />;
}
