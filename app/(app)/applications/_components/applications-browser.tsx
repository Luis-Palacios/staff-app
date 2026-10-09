"use client";

import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";

import ApplicationCardSummary from "./application-card-summary";
import ApplicationsSummaryTable from "./applications-summary-table";
import {
  STATUS_FILTERS,
  StatusFilter,
  type ApplicationStatusFilter,
} from "./status-filter";

function parseStatus(value: string | null): ApplicationStatusFilter {
  return STATUS_FILTERS.some(({ key }) => key === value)
    ? (value as ApplicationStatusFilter)
    : "all";
}

// Case- and accent-insensitive, so "maria" finds "María".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(
  application: ApplicationMembershipSummary,
  query: string,
): boolean {
  if (!query) return true;

  const id = query.replace(/^#/, "");

  return (
    normalize(application.personFullName).includes(query) ||
    (id !== "" && String(application.applicationId).includes(id))
  );
}

function matchesStatus(
  application: ApplicationMembershipSummary,
  status: ApplicationStatusFilter,
): boolean {
  if (status === "pending") return !application.isFulfilled;
  if (status === "fulfilled") return application.isFulfilled;

  return true;
}

// Toolbar + list for the applications page. The API has no filter
// parameters yet, so both filters run here over the list the server fetched.
// The status lives in the URL (?status=pending) so it survives a reload and
// can be linked to, as the dashboard's "Awaiting fulfilment" tile does.
export default function ApplicationsBrowser({
  applications,
}: {
  applications: ApplicationMembershipSummary[];
}) {
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const [query, setQuery] = useState("");

  // replaceState rather than router.replace: Next keeps useSearchParams in
  // sync with it, and it doesn't refetch the page (and the list) from the
  // server on every click.
  const setStatus = (next: ApplicationStatusFilter) => {
    const params = new URLSearchParams(window.location.search);

    if (next === "all") params.delete("status");
    else params.set("status", next);

    const search = params.toString();

    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname,
    );
  };

  const matchingQuery = useMemo(() => {
    const normalized = normalize(query);

    return applications.filter((application) =>
      matchesQuery(application, normalized),
    );
  }, [applications, query]);

  // Counts follow the text filter, so each segment says how many rows it
  // would show.
  const counts = {
    all: matchingQuery.length,
    pending: matchingQuery.filter((a) => matchesStatus(a, "pending")).length,
    fulfilled: matchingQuery.filter((a) => matchesStatus(a, "fulfilled"))
      .length,
  };

  const visible = matchingQuery.filter((application) =>
    matchesStatus(application, status),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <StatusFilter counts={counts} value={status} onChange={setStatus} />
        <TextField
          aria-label="Filter applications"
          className="w-full sm:ml-auto sm:w-[300px]"
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
              placeholder="Name or application #"
            />
          </InputGroup>
        </TextField>
      </div>

      {/* The table footer shows the count visually; this announces it. */}
      <p aria-live="polite" className="sr-only">
        {visible.length === 1
          ? "1 application"
          : `${visible.length} applications`}
      </p>

      <div className="hidden md:block">
        <ApplicationsSummaryTable data={visible} />
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No applications match these filters.
          </p>
        ) : (
          visible.map((application) => (
            <ApplicationCardSummary
              key={application.applicationId}
              application={application}
            />
          ))
        )}
      </div>
    </>
  );
}
