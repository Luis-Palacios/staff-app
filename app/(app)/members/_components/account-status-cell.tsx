"use client";

import type { AccountStatus } from "@/lib/members/account";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

// Sign-in off (inactive and banned), Linked and Invited get a pill; No account is plain muted text, as the list is mostly that.
export function AccountStatusCell({
  status,
  signInOff,
}: {
  status: AccountStatus;
  /** An inactive member whose user is banned: sign-in is off, whatever else the link says. */
  signInOff?: boolean;
}) {
  const t = useTranslations("AccountStatus");

  if (signInOff) {
    return (
      <StatusBadge tone="danger" variant="ring-dot">
        {t("signInOff")}
      </StatusBadge>
    );
  }

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
