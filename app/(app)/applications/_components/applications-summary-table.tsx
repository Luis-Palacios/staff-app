"use client";

import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

import { Table } from "@heroui/react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("ApplicationsBrowser");
  const { root, column, row, cell } = dataTable();

  return (
    <Table
      aria-label={t("tableLabel")}
      className={root()}
      id="applications-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label={t("tableLabel")} className="min-w-[760px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("columnPerson")}
            </Table.Column>
            <Table.Column className={column()}>
              {t("columnApplication")}
            </Table.Column>
            <Table.Column className={column()}>
              {t("columnSubmitted")}
            </Table.Column>
            <Table.Column className={column()}>
              {t("columnFulfilled")}
            </Table.Column>
            <Table.Column className={column()}>
              {t("columnStatus")}
            </Table.Column>
            <Table.Column className={column()}>
              <span className="sr-only">{t("columnActions")}</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">
                {t("noMatches")}
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
                      secondary={t("personNumber", {
                        id: application.personId,
                      })}
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
                      <span className="text-muted">{t("notYet")}</span>
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
                      label={t("openApplication", {
                        name: application.personFullName,
                      })}
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
