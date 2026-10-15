"use client";

import type { AccountStatus } from "@/lib/members/account";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

// Linked and Invited get a pill; No account is plain muted text, as the list is mostly that.
export function AccountStatusCell({ status }: { status: AccountStatus }) {
  const t = useTranslations("AccountStatus");

  if (status === "linked") {
    return <StatusBadge tone="success">{t("linked")}</StatusBadge>;
  }

  if (status === "invited") {
    return (
      <StatusBadge tone="warning" variant="ring-dot">
        {t("invited")}
      </StatusBadge>
    );
  }

  return <span className="text-sm text-subtle">{t("none")}</span>;
}
