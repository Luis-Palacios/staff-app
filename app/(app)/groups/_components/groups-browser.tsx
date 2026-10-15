"use client";

import type { SmallGroupSummary } from "@/api/small-groups-api/types";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";

import { GroupCard } from "./group-card";

import { StatusTabs } from "@/components/status-tabs";
import { normalizeText } from "@/lib/normalize-text";

type GroupStatusFilter = "active" | "closed" | "all";

const STATUS_KEYS = ["active", "closed", "all"] as const;

function parseStatus(value: string | null): GroupStatusFilter {
  return STATUS_KEYS.find((key) => key === value) ?? "active";
}

function matchesQuery(group: SmallGroupSummary, query: string): boolean {
  if (!query) return true;

  return [group.name, group.leaderName, group.meetingAddress].some(
    (field) => field && normalizeText(field).includes(query),
  );
}

function matchesStatus(
  group: SmallGroupSummary,
  status: GroupStatusFilter,
): boolean {
  if (status === "active") return group.closedAt === null;
  if (status === "closed") return group.closedAt !== null;

  return true;
}

// Toolbar + card grid for the groups page. The API lists every group, so both
// filters run here. The status lives in the URL (?status=closed) so it
// survives a reload; Active, the default, is left out of it.
export default function GroupsBrowser({
  groups,
}: {
  groups: SmallGroupSummary[];
}) {
  const t = useTranslations("GroupsBrowser");
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const [query, setQuery] = useState("");

  // replaceState rather than router.replace: see ApplicationsBrowser.
  const setStatus = (next: GroupStatusFilter) => {
    const params = new URLSearchParams(window.location.search);

    if (next === "active") params.delete("status");
    else params.set("status", next);

    const search = params.toString();

    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname,
    );
  };

  const matchingQuery = useMemo(() => {
    const normalized = normalizeText(query);

    return groups.filter((group) => matchesQuery(group, normalized));
  }, [groups, query]);

  // Counts follow the text filter, so each tab says how many cards it shows.
  const counts = {
    active: matchingQuery.filter((g) => matchesStatus(g, "active")).length,
    closed: matchingQuery.filter((g) => matchesStatus(g, "closed")).length,
    all: matchingQuery.length,
  };

  // API order is by name; in All, open groups come first, then closed ones.
  const visible = matchingQuery
    .filter((group) => matchesStatus(group, status))
    .sort((a, b) => Number(a.closedAt !== null) - Number(b.closedAt !== null));

  let emptyMessage = t("noActive");

  if (query) emptyMessage = t("noMatches");
  else if (status === "closed") emptyMessage = t("noClosed");

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <StatusTabs
          ariaLabel={t("filterByStatus")}
          counts={counts}
          options={[
            { key: "active", label: t("filterActive") },
            { key: "closed", label: t("filterClosed") },
            { key: "all", label: t("filterAll") },
          ]}
          value={status}
          onChange={setStatus}
        />
        <TextField
          aria-label={t("filterLabel")}
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
              placeholder={t("filterPlaceholder")}
            />
          </InputGroup>
        </TextField>
      </div>

      <p aria-live="polite" className="sr-only">
        {t("count", { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
          {visible.map((group) => (
            <li key={group.id} className="flex">
              <GroupCard group={group} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
