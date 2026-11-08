"use client";

import type { AdminUserListItem } from "@/api/auth-api/types";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { replaceParam } from "../_lib/replace-param";

import UserCardSummary from "./user-card-summary";
import UsersSummaryTable from "./users-summary-table";

import { FilterSelect } from "@/components/filter-select";
import { SearchField } from "@/components/search-field";
import { StatusTabs } from "@/components/status-tabs";
import { AUTH_ROLES, type AuthRole } from "@/lib/auth/roles";
import { normalizeText } from "@/lib/normalize-text";

/** The member a user is linked to, by user id. */
export type LinkedMembers = Record<string, { id: number; name: string }>;

type MemberFilter = "all" | "linked" | "notLinked";
type RoleFilter = "all" | AuthRole;
type StatusFilter = "all" | "active" | "banned" | "unverified";

const MEMBER_FILTERS = [
  { key: "all", labelKey: "filterAllUsers" },
  { key: "linked", labelKey: "filterLinked" },
  { key: "notLinked", labelKey: "filterNotLinked" },
] as const satisfies readonly {
  key: MemberFilter;
  labelKey: "filterAllUsers" | "filterLinked" | "filterNotLinked";
}[];

const STATUS_FILTERS = [
  { key: "all", labelKey: "statusAll" },
  { key: "active", labelKey: "statusActive" },
  { key: "banned", labelKey: "statusBanned" },
  { key: "unverified", labelKey: "statusUnverified" },
] as const satisfies readonly {
  key: StatusFilter;
  labelKey: "statusAll" | "statusActive" | "statusBanned" | "statusUnverified";
}[];

function parseMemberFilter(value: string | null): MemberFilter {
  return MEMBER_FILTERS.find(({ key }) => key === value)?.key ?? "all";
}

function parseStatusFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.find(({ key }) => key === value)?.key ?? "all";
}

function parseRoleFilter(value: string | null): RoleFilter {
  return AUTH_ROLES.find((role) => role === value) ?? "all";
}

// Same rules as UserStatusChips: a user both banned and unverified counts under each.
function hasStatus(user: AdminUserListItem, status: StatusFilter): boolean {
  switch (status) {
    case "all":
      return true;
    case "active":
      return !user.banned && user.emailVerified;
    case "banned":
      return Boolean(user.banned);
    case "unverified":
      return !user.emailVerified;
  }
}

// Search + filters + list for the users page. The server fetches every user, and the status tab,
// the search, the role and the member filter all run here over that list.
export default function UsersBrowser({
  users,
  members,
}: {
  users: AdminUserListItem[];
  members: LinkedMembers;
}) {
  const t = useTranslations("UsersTable");
  const tRoles = useTranslations("Roles");
  const searchParams = useSearchParams();
  const status = parseStatusFilter(searchParams.get("status"));
  const role = parseRoleFilter(searchParams.get("role"));
  const member = parseMemberFilter(searchParams.get("member"));
  const [query, setQuery] = useState("");

  // Everything but the status tab, so each tab's count says how many rows it would show.
  const matching = useMemo(() => {
    const normalized = normalizeText(query);

    return users.filter(
      (user) =>
        (role === "all" || user.role === role) &&
        (member === "all" ||
          Boolean(members[user.id]) === (member === "linked")) &&
        (!normalized ||
          normalizeText(user.name).includes(normalized) ||
          normalizeText(user.email).includes(normalized)),
    );
  }, [users, members, query, role, member]);

  const counts = Object.fromEntries(
    STATUS_FILTERS.map(({ key }) => [
      key,
      matching.filter((user) => hasStatus(user, key)).length,
    ]),
  ) as Record<StatusFilter, number>;
  const visible = matching.filter((user) => hasStatus(user, status));
  const emptyLabel = users.length === 0 ? t("empty") : t("noMatches");

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <StatusTabs
          ariaLabel={t("filterByStatus")}
          counts={counts}
          options={STATUS_FILTERS.map(({ key, labelKey }) => ({
            key,
            label: t(labelKey),
          }))}
          value={status}
          onChange={(next) =>
            replaceParam("status", next === "all" ? null : next)
          }
        />
        <SearchField
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={setQuery}
        />
        <FilterSelect
          label={t("filterByRole")}
          options={[
            { key: "all", label: t("allRoles") },
            ...AUTH_ROLES.map((key) => ({ key, label: tRoles(key) })),
          ]}
          value={role}
          onChange={(next) =>
            replaceParam("role", next === "all" ? null : next)
          }
        />
        <FilterSelect
          label={t("filterByMember")}
          options={MEMBER_FILTERS.map(({ key, labelKey }) => ({
            key,
            label: t(labelKey),
          }))}
          value={member}
          onChange={(next) =>
            replaceParam("member", next === "all" ? null : next)
          }
        />
        <p aria-live="polite" className="sr-only">
          {t("count", { count: visible.length })}
        </p>
      </div>

      <div className="hidden md:block">
        <UsersSummaryTable
          data={visible}
          emptyLabel={emptyLabel}
          members={members}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{emptyLabel}</p>
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
