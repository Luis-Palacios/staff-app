"use client";

import type { ReactNode } from "react";

import { Table } from "@heroui/react";

import { DataTablePrimaryCell, dataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";

export interface AttendanceTableRow {
  memberId: number;
  name: string;
  href?: string;
  /** Role, "Missed the last N meetings" or "In the group since": already translated. */
  sub: ReactNode;
  attendedGroup: boolean;
  attendedChurch: boolean;
  /** Only present when observations are visible to the caller. */
  observation?: string | null;
  /** The Conversation cell; present for every row when `showConversations`. */
  conversation?: ReactNode;
}

export interface AttendanceTableLabels {
  table: string;
  member: string;
  colMeeting: string;
  colChurch: string;
  observation: string;
  conversation: string;
  attended: string;
  absent: string;
  atChurch: string;
  notAtChurch: string;
}

function Attended({
  yes,
  yesLabel,
  noLabel,
}: {
  yes: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return yes ? (
    <StatusBadge tone="success">{yesLabel}</StatusBadge>
  ) : (
    <StatusBadge tone="neutral" variant="ring-dot">
      {noLabel}
    </StatusBadge>
  );
}

// A client component because HeroUI's Table builds its rows from a collection in the browser; the
// server renders only the text. The observation column exists only when `showObservations`, the
// conversation column only when `showConversations`.
export function ReportAttendanceTable({
  rows,
  labels,
  showObservations,
  showConversations,
}: {
  rows: AttendanceTableRow[];
  labels: AttendanceTableLabels;
  showObservations: boolean;
  showConversations: boolean;
}) {
  const { column, row, cell } = dataTable();

  return (
    <Table
      aria-label={labels.table}
      className="rounded-none border-0 shadow-none"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label={labels.table} className="min-w-[560px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {labels.member}
            </Table.Column>
            <Table.Column className={column()}>
              {labels.colMeeting}
            </Table.Column>
            <Table.Column className={column()}>{labels.colChurch}</Table.Column>
            {showObservations && (
              <Table.Column className={column()}>
                {labels.observation}
              </Table.Column>
            )}
            {showConversations && (
              <Table.Column className={column({ className: "text-right" })}>
                {labels.conversation}
              </Table.Column>
            )}
          </Table.Header>
          <Table.Body>
            {rows.map((person) => (
              <Table.Row key={person.memberId} className={row()}>
                <Table.Cell className={cell()}>
                  <DataTablePrimaryCell
                    href={person.href}
                    name={person.name}
                    secondary={person.sub}
                  />
                </Table.Cell>
                <Table.Cell className={cell()}>
                  <Attended
                    noLabel={labels.absent}
                    yes={person.attendedGroup}
                    yesLabel={labels.attended}
                  />
                </Table.Cell>
                <Table.Cell className={cell()}>
                  <Attended
                    noLabel={labels.notAtChurch}
                    yes={person.attendedChurch}
                    yesLabel={labels.atChurch}
                  />
                </Table.Cell>
                {showObservations && (
                  <Table.Cell className={cell({ className: "max-w-[360px]" })}>
                    {person.observation ? (
                      <span className="whitespace-pre-line text-[13.5px] leading-snug">
                        {person.observation}
                      </span>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </Table.Cell>
                )}
                {showConversations && (
                  <Table.Cell
                    className={cell({
                      className: "whitespace-nowrap text-right",
                    })}
                  >
                    {person.conversation}
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
