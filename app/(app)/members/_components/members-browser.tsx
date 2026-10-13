"use client";

import type { MemberSummary } from "@/api/members-api/types";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";

import MemberCardSummary from "./member-card-summary";
import MembersSummaryTable from "./members-summary-table";

import { normalizeText } from "@/lib/normalize-text";

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
}: {
  members: MemberSummary[];
}) {
  const t = useTranslations("MembersBrowser");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const normalized = normalizeText(query);
    const queryDigits = digitsOf(query);

    return members.filter((member) =>
      matchesQuery(member, normalized, queryDigits),
    );
  }, [members, query]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
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
        <MembersSummaryTable data={visible} />
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {t("noMatches")}
          </p>
        ) : (
          visible.map((member) => (
            <MemberCardSummary key={member.id} member={member} />
          ))
        )}
      </div>
    </>
  );
}
