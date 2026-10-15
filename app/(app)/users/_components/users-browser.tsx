"use client";

import type { AdminUserListItem } from "@/api/auth-api/types";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import UserCardSummary from "./user-card-summary";
import UsersSummaryTable from "./users-summary-table";

import { StatusTabs } from "@/components/status-tabs";

/** The member a user is linked to, by user id. */
export type LinkedMembers = Record<string, { id: number; name: string }>;

type MemberFilter = "all" | "linked" | "notLinked";

const MEMBER_FILTERS = [
  { key: "all", labelKey: "filterAll" },
  { key: "linked", labelKey: "filterLinked" },
  { key: "notLinked", labelKey: "filterNotLinked" },
] as const satisfies readonly {
  key: MemberFilter;
  labelKey: "filterAll" | "filterLinked" | "filterNotLinked";
}[];

function parseFilter(value: string | null): MemberFilter {
  return MEMBER_FILTERS.find(({ key }) => key === value)?.key ?? "all";
}

// Filter + list for the users page. Filtering runs here over the list the server fetched.
export default function UsersBrowser({
  users,
  members,
}: {
  users: AdminUserListItem[];
  members: LinkedMembers;
}) {
  const t = useTranslations("UsersTable");
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("member"));

  // replaceState, as on the applications page: no refetch of the list per click.
  const setFilter = (next: MemberFilter) => {
    const params = new URLSearchParams(window.location.search);

    if (next === "all") params.delete("member");
    else params.set("member", next);

    const search = params.toString();

    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname,
    );
  };

  const linkedCount = users.filter((user) => members[user.id]).length;
  const counts: Record<MemberFilter, number> = {
    all: users.length,
    linked: linkedCount,
    notLinked: users.length - linkedCount,
  };
  const visible = users.filter(
    (user) =>
      filter === "all" || Boolean(members[user.id]) === (filter === "linked"),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <StatusTabs
          ariaLabel={t("filterByMember")}
          counts={counts}
          options={MEMBER_FILTERS.map(({ key, labelKey }) => ({
            key,
            label: t(labelKey),
          }))}
          value={filter}
          onChange={setFilter}
        />
        <p aria-live="polite" className="sr-only">
          {t("count", { count: visible.length })}
        </p>
      </div>

      <div className="hidden md:block">
        <UsersSummaryTable
          data={visible}
          emptyLabel={users.length === 0 ? t("empty") : t("noMatches")}
          members={members}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {users.length === 0 ? t("empty") : t("noMatches")}
          </p>
        ) : (
          visible.map((user) => (
            <UserCardSummary
              key={user.id}
              member={members[user.id]}
              user={user}
            />
          ))
        )}
      </div>
    </>
  );
}
