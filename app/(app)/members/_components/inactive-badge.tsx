"use client";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

// Neutral with a hollow dot: out of the church's current life, but not an error.
export function InactiveBadge() {
  const t = useTranslations("MemberStatus");

  return (
    <StatusBadge tone="neutral" variant="ring-dot">
      {t("inactive")}
    </StatusBadge>
  );
}
