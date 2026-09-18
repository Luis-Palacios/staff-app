import { Card } from "@heroui/react/card";
import { Link } from "@heroui/react/link";

import { ResendVerificationButton } from "./_components/resend-verification-button";

export default async function NeedsVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
      <Card.Header>
        <Card.Title className="text-lg">Check your email</Card.Title>
        <Card.Description className="text-base">
          {email ? (
            <>
              We sent a verification link to <strong>{email}</strong>. Click it,
              then sign in.
            </>
          ) : (
            "We sent you a verification link by email. Click it, then sign in."
          )}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <ResendVerificationButton initialEmail={email ?? null} />
      </Card.Content>

      <Card.Footer className="flex flex-col">
        <Link className="text-base" href="/sign-in">
          Back to sign in
        </Link>
      </Card.Footer>
    </Card.Root>
  );
}
