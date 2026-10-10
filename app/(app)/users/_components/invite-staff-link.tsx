import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";

// Primary header action on the dashboard and the users page.
export function InviteStaffLink() {
  return (
    <NextLink
      className={buttonVariants({
        variant: "primary",
        className: "h-[42px] gap-2 px-[18px] md:h-[42px]",
      })}
      href="/users/invites"
    >
      <EnvelopeIcon
        aria-hidden="true"
        className="size-[18px]"
        strokeWidth={1.8}
      />
      Invite staff
    </NextLink>
  );
}
