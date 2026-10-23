import type { GuestListItem } from "@/api/guests-api/types";

import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { GuestLastSeen } from "./guest-last-seen";

import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";

// Mobile stand-in for a table row: avatar, name, group line, then last time at a meeting. The
// whole card is the link; the group is plain text here so there is no link inside a link.
export default function GuestCardSummary({ guest }: { guest: GuestListItem }) {
  const t = useTranslations("GuestsBrowser");
  const group = guest.currentGroup?.name ?? t("noGroup");

  return (
    <NextLink
      className={card({
        interactive: true,
        className: "flex flex-col gap-2 p-4",
      })}
      href={`/guests/${guest.id}`}
    >
      <span className="flex items-center gap-3">
        <InitialsAvatar name={guest.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold text-heading">
            {guest.name}
          </span>
          <span className="truncate text-[13px] text-muted">{group}</span>
        </span>
        <GuestLastSeen guest={guest} />
      </span>
      {guest.phone && (
        <span className="truncate pl-12 text-[13px] text-muted">
          {guest.phone}
        </span>
      )}
    </NextLink>
  );
}
