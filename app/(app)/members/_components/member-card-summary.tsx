import type { MemberSummary } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { AccountStatusCell } from "./account-status-cell";

import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";

// Mobile stand-in for a table row: avatar, name and number, then the contact
// lines that exist. The whole card is the link.
export default function MemberCardSummary({
  member,
  status,
}: {
  member: MemberSummary;
  /** Absent for roles that can't see links. */
  status?: AccountStatus;
}) {
  const t = useTranslations("MembersBrowser");

  return (
    <NextLink
      className={card({
        interactive: true,
        className: "flex flex-col gap-2 p-4",
      })}
      href={`/members/${member.id}`}
    >
      <span className="flex items-center gap-3">
        <InitialsAvatar name={member.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold text-heading">
            {member.name}
          </span>
          <span className="text-[13px] text-muted">
            {t("memberNumber", { id: String(member.id) })}
          </span>
        </span>
        {status && <AccountStatusCell status={status} />}
      </span>
      {(member.email || member.phone) && (
        <span className="flex flex-col gap-0.5 pl-12 text-[13px] text-muted">
          {member.email && <span className="truncate">{member.email}</span>}
          {member.phone && <span className="truncate">{member.phone}</span>}
        </span>
      )}
    </NextLink>
  );
}
