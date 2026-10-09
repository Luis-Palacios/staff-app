import { Card } from "@heroui/react/card";
import { Link } from "@heroui/react/link";
import { buttonVariants } from "@heroui/react";

import { ApplicationStatusBadge } from "./application-status-badge";

import { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";
import { LocalDateTime } from "@/components/local-date-time";

export default function ApplicationCardSummary({
  application,
}: {
  application: ApplicationMembershipSummary;
}) {
  return (
    <Card.Root key={application.applicationId}>
      <Card.Header>
        <Card.Title>{application.personFullName}</Card.Title>
        <Card.Description>
          Application #{application.applicationId}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1 text-sm">
        <div>Person ID: {application.personId}</div>
        <div>
          Generated: <LocalDateTime value={application.generatedDate} />
        </div>
        <div>
          Fulfilled: <LocalDateTime value={application.fulfilmentDate} />
        </div>
      </Card.Content>
      <Card.Footer className="flex items-center justify-between">
        <ApplicationStatusBadge isFulfilled={application.isFulfilled} />
        <Link
          className={buttonVariants({
            size: "sm",
            variant: "secondary",
          })}
          href={`/applications/${application.applicationId}`}
        >
          Show more
        </Link>
      </Card.Footer>
    </Card.Root>
  );
}
