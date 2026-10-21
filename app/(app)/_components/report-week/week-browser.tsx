"use client";

import type { ReportWeekStatus } from "@/api/small-groups-api/types";
import type { WeekPill } from "./week-counts";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";

import { type WeekRowView } from "./week-rows";
import { WeekCards } from "./week-cards";
import { type WeekLabels, WeekTable } from "./week-table";

import { StatusBadge } from "@/components/status-badge";
import { normalizeText } from "@/lib/normalize-text";

/**
 * The week's summary pills with a search box beside them, and the table/cards below. The week
 * is already loaded, so the search (group name, leaders and co-leaders) filters here. The pills
 * stay the week's totals.
 */
export function WeekBrowser({
  rows,
  pills,
  labels,
  pillsLabel,
  searchLabel,
  searchPlaceholder,
  noMatches,
}: {
  rows: WeekRowView[];
  /** The summary pills; each one filters the rows to its status. */
  pills: WeekPill[];
  pillsLabel: string;
  labels: WeekLabels;
  searchLabel: string;
  searchPlaceholder: string;
  noMatches: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportWeekStatus | null>(null);
  const visible = useMemo(() => {
    const normalized = normalizeText(query);

    return rows.filter(
      (row) =>
        (status === null || row.status === status) &&
        normalizeText(`${row.name} ${row.leaders ?? ""}`).includes(normalized),
    );
  }, [rows, query, status]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <ul aria-label={pillsLabel} className="m-0 flex flex-wrap gap-2 p-0">
          {pills.map((pill) => (
            <li key={pill.status} className="list-none">
              <button
                aria-pressed={status === pill.status}
                className="rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-accent aria-pressed:ring-2 aria-pressed:ring-heading"
                type="button"
                onClick={() =>
                  setStatus(status === pill.status ? null : pill.status)
                }
              >
                <StatusBadge
                  className="h-8 cursor-pointer gap-[7px] pl-2.5 pr-3 text-[13.5px] font-normal"
                  {...pill.badge}
                >
                  {pill.label}
                </StatusBadge>
              </button>
            </li>
          ))}
        </ul>
        <TextField
          aria-label={searchLabel}
          className="w-full sm:ml-auto sm:w-[280px]"
          type="search"
          value={query}
          onChange={setQuery}
        >
          <InputGroup className="h-10 w-full">
            <InputGroup.Prefix className="border-0 pl-3 pr-2">
              <MagnifyingGlassIcon
                className="pointer-events-none size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
            </InputGroup.Prefix>
            <InputGroup.Input
              className="text-sm"
              placeholder={searchPlaceholder}
            />
          </InputGroup>
        </TextField>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted" role="status">
          {noMatches}
        </p>
      ) : (
        <>
          <WeekTable rows={visible} t={labels} />
          <WeekCards rows={visible} t={labels} />
        </>
      )}
    </>
  );
}
