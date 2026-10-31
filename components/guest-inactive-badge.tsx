"use client";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

// Neutral with a hollow dot, as for an inactive member.
export function GuestInactiveBadge() {
  const t = useTranslations("GuestStatus");

  return (
    <StatusBadge tone="neutral" variant="ring-dot">
      {t("inactive")}
    </StatusBadge>
  );
}
