"use client";

import type { MemberSummary } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";

import MemberCardSummary from "./member-card-summary";
import MembersSummaryTable from "./members-summary-table";

import { StatusTabs } from "@/components/status-tabs";
import { normalizeText } from "@/lib/normalize-text";

type AccountFilter = "all" | AccountStatus;
type StatusTab = "active" | "inactive" | "all";

const STATUS_TABS = [
  { key: "active", labelKey: "statusActive" },
  { key: "inactive", labelKey: "statusInactive" },
  { key: "all", labelKey: "statusAll" },
] as const satisfies readonly {
  key: StatusTab;
  labelKey: "statusActive" | "statusInactive" | "statusAll";
}[];

// Active is the default, so its param is dropped from the URL.
function parseStatusTab(value: string | null): StatusTab {
  return STATUS_TABS.find(({ key }) => key === value)?.key ?? "active";
}

const ACCOUNT_FILTERS = [
  { key: "all", labelKey: "filterAll" },
  { key: "linked", labelKey: "filterLinked" },
  { key: "invited", labelKey: "filterInvited" },
  { key: "none", labelKey: "filterNone" },
] as const satisfies readonly {
  key: AccountFilter;
  labelKey: "filterAll" | "filterLinked" | "filterInvited" | "filterNone";
}[];

function parseAccountFilter(value: string | null): AccountFilter {
  return ACCOUNT_FILTERS.find(({ key }) => key === value)?.key ?? "all";
}

const digitsOf = (text: string) => text.replace(/\D/g, "");

function matchesQuery(
  member: MemberSummary,
  query: string,
  queryDigits: string,
): boolean {
  if (!query) return true;

  return (
    normalizeText(member.name).includes(query) ||
    (member.email !== null && normalizeText(member.email).includes(query)) ||
    // Digits only, so "8812" finds "+505 8812 3401".
    (queryDigits !== "" &&
      member.phone !== null &&
      digitsOf(member.phone).includes(queryDigits))
  );
}

// replaceState, as on the applications page: no refetch of the list per click.
function replaceParam(name: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);

  if (value === null) params.delete(name);
  else params.set(name, value);

  const search = params.toString();

  window.history.replaceState(
    null,
    "",
    search ? `?${search}` : window.location.pathname,
  );
}

// Search + tabs + list for the members page. The server fetches every member (`status=all`), and
// the status tab, the account filter and the search all run here over that list.
export default function MembersBrowser({
  members,
  accounts,
  signInOff,
}: {
  /** Active and inactive members together. */
  members: MemberSummary[];
  /** Account status by member id; absent for roles that can't see links (no column, no filter). */
  accounts?: Record<number, AccountStatus>;
  /** Ids of inactive members whose linked user is banned. */
  signInOff?: readonly number[];
}) {
  const t = useTranslations("MembersBrowser");
  const searchParams = useSearchParams();
  const tab = parseStatusTab(searchParams.get("status"));
  // The Inactive tab has no Account column or filter: those members can't sign in.
  const showAccounts = accounts && tab !== "inactive";
  const account = showAccounts
    ? parseAccountFilter(searchParams.get("account"))
    : "all";
  const [query, setQuery] = useState("");
  const signInOffIds = useMemo(() => new Set(signInOff), [signInOff]);

  const setAccount = (next: AccountFilter) =>
    replaceParam("account", next === "all" ? null : next);
  const setTab = (next: StatusTab) =>
    replaceParam("status", next === "active" ? null : next);

  const matchingQuery = useMemo(() => {
    const normalized = normalizeText(query);
    const queryDigits = digitsOf(query);

    return members.filter((member) =>
      matchesQuery(member, normalized, queryDigits),
    );
  }, [members, query]);

  // Counts follow the search, so each segment says how many rows it would show.
  const statusCounts: Record<StatusTab, number> = {
    active: 0,
    inactive: 0,
    all: matchingQuery.length,
  };

  for (const member of matchingQuery) statusCounts[member.status]++;

  const inTab =
    tab === "all"
      ? matchingQuery
      : matchingQuery.filter((member) => member.status === tab);
  const counts: Record<AccountFilter, number> = {
    all: inTab.length,
    linked: 0,
    invited: 0,
    none: 0,
  };

  if (accounts) {
    for (const member of inTab) counts[accounts[member.id] ?? "none"]++;
  }

  const visible =
    showAccounts && account !== "all"
      ? inTab.filter((member) => (accounts[member.id] ?? "none") === account)
      : inTab;
  const emptyLine =
    query || account !== "all"
      ? t("noMatches")
      : tab === "inactive"
        ? t("noInactive")
        : t("noActive");

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <StatusTabs
          ariaLabel={t("filterByStatus")}
          counts={statusCounts}
          options={STATUS_TABS.map(({ key, labelKey }) => ({
            key,
            label: t(labelKey),
          }))}
          value={tab}
          onChange={setTab}
        />
        <TextField
          aria-label={t("filterLabel")}
          className="w-full sm:w-[340px]"
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
        {showAccounts && (
          <StatusTabs
            ariaLabel={t("filterByAccount")}
            counts={counts}
            options={ACCOUNT_FILTERS.map(({ key, labelKey }) => ({
              key,
              label: t(labelKey),
            }))}
            value={account}
            onChange={setAccount}
          />
        )}
        <p aria-live="polite" className="text-sm text-muted">
          {t.rich("count", {
            count: visible.length,
            num: (chunks) => (
              <span className="font-semibold text-heading">{chunks}</span>
            ),
          })}
        </p>
      </div>

      <div className="hidden md:block">
        <MembersSummaryTable
          accounts={showAccounts ? accounts : undefined}
          data={visible}
          emptyLine={emptyLine}
          signInOff={signInOffIds}
          tab={tab}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{emptyLine}</p>
        ) : (
          visible.map((member) => (
            <MemberCardSummary
              key={member.id}
              member={member}
              signInOff={signInOffIds.has(member.id)}
              status={showAccounts ? accounts[member.id] : undefined}
              tab={tab}
            />
          ))
        )}
      </div>
    </>
  );
}
