"use client";

import { useTranslations } from "next-intl";

import { StatusTabs } from "@/components/status-tabs";

export type ApplicationStatusFilter = "all" | "pending" | "fulfilled";

export const STATUS_FILTERS = [
  { key: "all", labelKey: "filterAll" },
  { key: "pending", labelKey: "filterPending" },
  { key: "fulfilled", labelKey: "filterFulfilled" },
] as const satisfies readonly {
  key: ApplicationStatusFilter;
  labelKey: "filterAll" | "filterPending" | "filterFulfilled";
}[];

export function StatusFilter({
  value,
  counts,
  onChange,
}: {
  value: ApplicationStatusFilter;
  counts: Record<ApplicationStatusFilter, number>;
  onChange: (value: ApplicationStatusFilter) => void;
}) {
  const t = useTranslations("ApplicationsBrowser");

  return (
    <StatusTabs
      ariaLabel={t("filterByStatus")}
      counts={counts}
      options={STATUS_FILTERS.map(({ key, labelKey }) => ({
        key,
        label: t(labelKey),
      }))}
      value={value}
      onChange={onChange}
    />
  );
}
