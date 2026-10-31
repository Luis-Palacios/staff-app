import type { MemberSummary } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { AccountStatusCell } from "./account-status-cell";
import { InactiveBadge } from "./inactive-badge";

import { InactiveReasonChip } from "@/components/inactive-reason-chip";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";
import { formatCalendarDate } from "@/lib/format-date";

// Mobile stand-in for a table row: avatar, name and number, then the contact
// lines that exist. The whole card is the link.
export default function MemberCardSummary({
  member,
  status,
  signInOff,
  tab,
}: {
  member: MemberSummary;
  /** Absent for roles that can't see links, and on the Inactive tab. */
  status?: AccountStatus;
  signInOff?: boolean;
  tab: "active" | "inactive" | "all";
}) {
  const t = useTranslations("MembersBrowser");
  const locale = useLocale();
  const inactive = member.status === "inactive";
  const left = member.inactiveSince
    ? formatCalendarDate(member.inactiveSince, locale)
    : null;

  return (
    <NextLink
      className={card({
        interactive: true,
        className: "flex flex-col gap-2 p-4",
      })}
      href={`/members/${member.id}`}
    >
      <span className="flex items-center gap-3">
        <InitialsAvatar muted={inactive} name={member.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-heading">
              {member.name}
            </span>
            {tab === "all" && inactive && (
              <span className="shrink-0">
                <InactiveBadge />
              </span>
            )}
          </span>
          <span className="text-[13px] text-muted">
            {t("memberNumber", { id: String(member.id) })}
          </span>
        </span>
        {status && <AccountStatusCell signInOff={signInOff} status={status} />}
      </span>
      {inactive && left && (
        <span className="flex flex-wrap items-center gap-2 pl-12 text-[13px] text-muted">
          {t("leftOn", { date: left })}
          <InactiveReasonChip reason={member.inactiveReason} />
        </span>
      )}
      {(member.email || member.phone) && (
        <span className="flex flex-col gap-0.5 pl-12 text-[13px] text-muted">
          {member.email && <span className="truncate">{member.email}</span>}
          {member.phone && <span className="truncate">{member.phone}</span>}
        </span>
      )}
    </NextLink>
  );
}
