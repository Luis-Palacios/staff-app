import NextLink from "next/link";

import { ApplicationStatusBadge } from "./application-status-badge";

import { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";
import { InitialsAvatar } from "@/components/initials-avatar";
import { LocalDate } from "@/components/local-date";
import { card } from "@/components/primitives";

// Mobile stand-in for a table row: avatar, name and badge, then a muted line.
// The whole card is the link.
export default function ApplicationCardSummary({
  application,
}: {
  application: ApplicationMembershipSummary;
}) {
  return (
    <NextLink
      className={card({
        interactive: true,
        className: "flex flex-col gap-2 p-4",
      })}
      href={`/applications/${application.applicationId}`}
    >
      <span className="flex items-center gap-3">
        <InitialsAvatar name={application.personFullName} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-heading">
          {application.personFullName}
        </span>
        <ApplicationStatusBadge isFulfilled={application.isFulfilled} />
      </span>
      <span className="pl-12 text-[13px] text-muted">
        #{application.applicationId} · Submitted{" "}
        <LocalDate value={application.generatedDate} />
      </span>
    </NextLink>
  );
}
