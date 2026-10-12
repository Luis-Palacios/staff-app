import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

export function ApplicationStatusBadge({
  isFulfilled,
}: {
  isFulfilled: boolean;
}) {
  const t = useTranslations("ApplicationStatus");

  return isFulfilled ? (
    <StatusBadge tone="success">{t("fulfilled")}</StatusBadge>
  ) : (
    <StatusBadge tone="warning" variant="ring-dot">
      {t("pending")}
    </StatusBadge>
  );
}
