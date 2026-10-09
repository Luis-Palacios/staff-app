"use client";

import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

import { Table } from "@heroui/react";

import { ApplicationStatusBadge } from "./application-status-badge";

import {
  DataTableFooter,
  DataTableOpenLink,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";
import { LocalDate } from "@/components/local-date";
import { LocalTime } from "@/components/local-time";

export default function ApplicationsSummaryTable({
  data,
}: {
  data: ApplicationMembershipSummary[];
}) {
  const { root, column, row, cell } = dataTable();

  return (
    <Table
      aria-label="Membership applications"
      className={root()}
      id="applications-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Membership applications"
          className="min-w-[760px]"
        >
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              Person
            </Table.Column>
            <Table.Column className={column()}>Application</Table.Column>
            <Table.Column className={column()}>Submitted</Table.Column>
            <Table.Column className={column()}>Fulfilled</Table.Column>
            <Table.Column className={column()}>Status</Table.Column>
            <Table.Column className={column()}>
              <span className="sr-only">Actions</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">
                No applications match these filters.
              </p>
            )}
          >
            {data.map((application) => {
              const href = `/applications/${application.applicationId}`;

              return (
                <Table.Row key={application.applicationId} className={row()}>
                  <Table.Cell className={cell()}>
                    <DataTablePrimaryCell
                      href={href}
                      name={application.personFullName}
                      secondary={`Person #${application.personId}`}
                    />
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    #{application.applicationId}
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <span className="flex flex-col">
                      <span className="text-heading">
                        <LocalDate value={application.generatedDate} />
                      </span>
                      <span className="text-[12.5px] text-muted">
                        <LocalTime value={application.generatedDate} />
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    {application.isFulfilled ? (
                      <span className="text-heading">
                        <LocalDate value={application.fulfilmentDate} />
                      </span>
                    ) : (
                      <span className="text-muted">Not yet</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <ApplicationStatusBadge
                      isFulfilled={application.isFulfilled}
                    />
                  </Table.Cell>
                  <Table.Cell className={cell({ className: "text-right" })}>
                    <DataTableOpenLink
                      href={href}
                      label={`Open application from ${application.personFullName}`}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <DataTableFooter total={data.length} />
    </Table>
  );
}
