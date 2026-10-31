import type { GuestListItem, GuestStatusFilter } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { GuestLastSeen } from "./guest-last-seen";

import { GuestInactiveBadge } from "@/components/guest-inactive-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";
import { formatCalendarDate } from "@/lib/format-date";

// Mobile stand-in for a table row: avatar, name, group line, then last time at a meeting. An
// inactive guest shows their last group and the Left line instead. The whole card is the link; the
// group is plain text here so there is no link inside a link.
export default function GuestCardSummary({
  guest,
  tab,
}: {
  guest: GuestListItem;
  tab: GuestStatusFilter;
}) {
  const t = useTranslations("GuestsBrowser");
  const tReason = useTranslations("GuestInactiveReason");
  const locale = useLocale() as Locale;
  const { inactiveSince, inactiveReason } = guest;
  const inactive = guest.status === "inactive";
  const group =
    (inactive ? guest.lastGroup?.name : guest.currentGroup?.name) ??
    t("noGroup");
  const left = inactiveSince ? formatCalendarDate(inactiveSince, locale) : null;

  return (
    <NextLink
      className={card({
        interactive: true,
        className: "flex flex-col gap-2 p-4",
      })}
      href={`/guests/${guest.id}`}
    >
      <span className="flex items-center gap-3">
        <InitialsAvatar muted={inactive} name={guest.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-heading">
              {guest.name}
            </span>
            {tab === "all" && inactive && (
              <span className="shrink-0">
                <GuestInactiveBadge />
              </span>
            )}
          </span>
          <span className="truncate text-[13px] text-muted">{group}</span>
        </span>
        {!inactive && <GuestLastSeen guest={guest} />}
      </span>
      {inactive && left && (
        <span className="pl-12 text-[13px] text-muted">
          {inactiveReason
            ? t("leftWithReason", {
                date: left,
                reason: tReason(inactiveReason),
              })
            : t("left", { date: left })}
        </span>
      )}
      {guest.phone && (
        <span className="truncate pl-12 text-[13px] text-muted">
          {guest.phone}
        </span>
      )}
    </NextLink>
  );
}
