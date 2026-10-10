import type { ApplicationMembershipDetail } from "@/api/applications-membership-api/types";
import type { ReactNode } from "react";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";

import { ApplicationStatusBadge } from "../../_components/application-status-badge";

import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { InitialsAvatar } from "@/components/initials-avatar";
import { LocalDate } from "@/components/local-date";
import { LocalDateTime } from "@/components/local-date-time";
import { title } from "@/components/primitives";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";

// "Label **value**" pair in the meta line under the name.
function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span>
      {label} <strong className="font-semibold text-heading">{children}</strong>
    </span>
  );
}

// The person is the page: a large avatar, their name as the <h1> with the
// status beside it, and the application's ids and dates underneath. It
// replaces StaffAppPageHeader here, which has no slot for the avatar.
export function ApplicationDetailHeader({
  application,
}: {
  application: ApplicationMembershipDetail;
}) {
  const {
    applicationId,
    personId,
    personFullName,
    generatedDate,
    fulfilmentDate,
    isFulfilled,
  } = application;

  return (
    <header className="mb-6 flex flex-col gap-6">
      <StaffAppBreadcrumbs
        items={[
          applicationsBreadcrumb,
          { label: personFullName, href: `/applications/${applicationId}` },
        ]}
      />
      <div className="flex flex-wrap items-center gap-5">
        <InitialsAvatar
          className="bg-accent text-[22px] text-accent-foreground"
          name={personFullName}
          size="lg"
        />
        <div className="flex flex-[1_1_320px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={title({ size: "md" })}>{personFullName}</h1>
            <ApplicationStatusBadge isFulfilled={isFulfilled} />
          </div>
          <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <Meta label="Application">#{applicationId}</Meta>
            <Meta label="Person">#{personId}</Meta>
            <Meta label="Submitted">
              <LocalDateTime value={generatedDate} />
            </Meta>
            {isFulfilled ? (
              <Meta label="Fulfilled">
                <LocalDate value={fulfilmentDate} />
              </Meta>
            ) : (
              <span>Not fulfilled yet</span>
            )}
          </p>
        </div>
        <NextLink
          className={buttonVariants({
            variant: "outline",
            className: "gap-2 font-semibold text-heading",
          })}
          href="/applications"
        >
          <ArrowLeftIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
          All applications
        </NextLink>
      </div>
    </header>
  );
}
