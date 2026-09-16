"use client";

import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

import { Chip, Link, Table, buttonVariants } from "@heroui/react";

import { LocalDateTime } from "@/components/local-date-time";

export default function ApplicationsSummaryTable({
  data,
}: {
  data: ApplicationMembershipSummary[];
}) {
  return (
    <Table
      aria-label="Membership applications table"
      id="applications-summary-table"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label="Membership applications table content">
          <Table.Header>
            <Table.Column className="text-center">#</Table.Column>
            <Table.Column className="text-center">Actions</Table.Column>
            <Table.Column isRowHeader className="text-center">
              Application ID
            </Table.Column>
            <Table.Column className="text-center">Person ID</Table.Column>
            <Table.Column className="text-center">
              Person Full Name
            </Table.Column>
            <Table.Column className="text-center">Generated Date</Table.Column>
            <Table.Column className="text-center">Fulfilment Date</Table.Column>
            <Table.Column className="text-center">Is Fulfilled</Table.Column>
          </Table.Header>
          <Table.Body>
            {data.map((application, index) => (
              <Table.Row key={application.applicationId}>
                <Table.Cell>{index + 1}</Table.Cell>
                <Table.Cell>
                  <Link
                    className={buttonVariants({
                      size: "sm",
                      variant: "secondary",
                    })}
                    href={`/applications/${application.applicationId}`}
                  >
                    Details
                  </Link>
                </Table.Cell>
                <Table.Cell>{application.applicationId}</Table.Cell>
                <Table.Cell>{application.personId}</Table.Cell>
                <Table.Cell>{application.personFullName}</Table.Cell>
                <Table.Cell>
                  <LocalDateTime value={application.generatedDate} />
                </Table.Cell>
                <Table.Cell>
                  <LocalDateTime value={application.fulfilmentDate} />
                </Table.Cell>
                <Table.Cell>
                  <Chip color={application.isFulfilled ? "success" : "warning"}>
                    {application.isFulfilled ? "Yes" : "No"}
                  </Chip>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
