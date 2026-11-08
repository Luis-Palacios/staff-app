"use client";

import type { AdminInviteListItem } from "@/api/auth-api/types";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { replaceParam } from "../../_lib/replace-param";

import InviteCardSummary from "./invite-card-summary";
import {
  type DisplayInviteStatus,
  deriveInviteStatus,
} from "./invite-status-chips";
import InvitesSummaryTable from "./invites-summary-table";

import { FilterSelect } from "@/components/filter-select";
import { SearchField } from "@/components/search-field";
import { StatusTabs } from "@/components/status-tabs";
import { AUTH_ROLES, AuthRole } from "@/lib/auth/roles";
import { normalizeText } from "@/lib/normalize-text";

type StatusFilter = DisplayInviteStatus | "all";
// No invite is ever sent with the pending role (see new-invite-form.tsx).
const INVITE_ROLES = AUTH_ROLES.filter((role) => role !== AuthRole.Pending);

type RoleFilter = "all" | AuthRole;

// Pending first and the default: those are the ones staff can still act on.
const STATUS_FILTERS = [
  "pending",
  "used",
  "expired",
  "canceled",
  "rejected",
  "all",
] as const satisfies readonly StatusFilter[];

function parseStatusFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.find((key) => key === value) ?? "pending";
}

function parseRoleFilter(value: string | null): RoleFilter {
  return INVITE_ROLES.find((role) => role === value) ?? "all";
}

function matchesQuery(invite: AdminInviteListItem, query: string): boolean {
  if (!query) return true;

  return [
    ...(invite.emails ?? []),
    invite.email,
    invite.inviterName,
    invite.inviterEmail,
  ].some((text) => text !== null && normalizeText(text).includes(query));
}

// Search + filters + list for the invites page. The server fetches every invite, and the status
// tab, the search and the role all run here over that list.
export default function InvitesBrowser({
  invites,
  currentUserId,
}: {
  invites: AdminInviteListItem[];
  currentUserId: string;
}) {
  const t = useTranslations("InvitesTable");
  const tStatus = useTranslations("InviteStatus");
  const tRoles = useTranslations("Roles");
  const searchParams = useSearchParams();
  const status = parseStatusFilter(searchParams.get("status"));
  const role = parseRoleFilter(searchParams.get("role"));
  const [query, setQuery] = useState("");

  // Everything but the status tab, so each tab's count says how many rows it would show.
  const matching = useMemo(() => {
    const normalized = normalizeText(query);

    return invites
      .filter(
        (invite) =>
          (role === "all" || invite.role === role) &&
          matchesQuery(invite, normalized),
      )
      .map((invite) => ({ invite, status: deriveInviteStatus(invite) }));
  }, [invites, query, role]);

  const counts = Object.fromEntries(
    STATUS_FILTERS.map((key) => [
      key,
      key === "all"
        ? matching.length
        : matching.filter((row) => row.status === key).length,
    ]),
  ) as Record<StatusFilter, number>;
  const visible = matching
    .filter((row) => status === "all" || row.status === status)
    .map((row) => row.invite);
  // The default view (Pending, nothing else set) isn't a filter the viewer chose, so it gets its
  // own line rather than "no matches".
  const emptyLabel =
    invites.length === 0
      ? t("empty")
      : status === "pending" && !query && role === "all"
        ? t("noPending")
        : t("noMatches");

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <StatusTabs
          ariaLabel={t("filterByStatus")}
          counts={counts}
          options={STATUS_FILTERS.map((key) => ({
            key,
            label: key === "all" ? t("statusAll") : tStatus(key),
          }))}
          value={status}
          onChange={(next) =>
            replaceParam("status", next === "pending" ? null : next)
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
            ...INVITE_ROLES.map((key) => ({ key, label: tRoles(key) })),
          ]}
          value={role}
          onChange={(next) =>
            replaceParam("role", next === "all" ? null : next)
          }
        />
        <p aria-live="polite" className="sr-only">
          {t("count", { count: visible.length })}
        </p>
      </div>

      <div className="hidden md:block">
        <InvitesSummaryTable
          currentUserId={currentUserId}
          data={visible}
          emptyLabel={emptyLabel}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{emptyLabel}</p>
        ) : (
          visible.map((invite) => (
            <InviteCardSummary
              key={invite.id}
              currentUserId={currentUserId}
              invite={invite}
            />
          ))
        )}
      </div>
    </>
  );
}
