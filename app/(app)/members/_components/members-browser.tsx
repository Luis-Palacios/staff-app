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

// Search + list for the members page. The API has no filter parameters, so
// the search runs here over the list the server fetched.
export default function MembersBrowser({
  members,
  accounts,
}: {
  members: MemberSummary[];
  /** Account status by member id; absent for roles that can't see links (no column, no filter). */
  accounts?: Record<number, AccountStatus>;
}) {
  const t = useTranslations("MembersBrowser");
  const searchParams = useSearchParams();
  const account = accounts
    ? parseAccountFilter(searchParams.get("account"))
    : "all";
  const [query, setQuery] = useState("");

  // replaceState, as on the applications page: no refetch of the list per click.
  const setAccount = (next: AccountFilter) => {
    const params = new URLSearchParams(window.location.search);

    if (next === "all") params.delete("account");
    else params.set("account", next);

    const search = params.toString();

    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname,
    );
  };

  const matchingQuery = useMemo(() => {
    const normalized = normalizeText(query);
    const queryDigits = digitsOf(query);

    return members.filter((member) =>
      matchesQuery(member, normalized, queryDigits),
    );
  }, [members, query]);

  // Counts follow the search, so each segment says how many rows it would show.
  const counts: Record<AccountFilter, number> = {
    all: matchingQuery.length,
    linked: 0,
    invited: 0,
    none: 0,
  };

  if (accounts) {
    for (const member of matchingQuery) counts[accounts[member.id] ?? "none"]++;
  }

  const visible =
    accounts && account !== "all"
      ? matchingQuery.filter(
          (member) => (accounts[member.id] ?? "none") === account,
        )
      : matchingQuery;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {accounts && (
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
        <MembersSummaryTable accounts={accounts} data={visible} />
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {t("noMatches")}
          </p>
        ) : (
          visible.map((member) => (
            <MemberCardSummary
              key={member.id}
              member={member}
              status={accounts?.[member.id]}
            />
          ))
        )}
      </div>
    </>
  );
}
