import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { formatCalendarMonth } from "@/lib/format-date";

/** A month's heading (eyebrow size, with the number of reports) over its rows. */
export function TimelineMonth({
  month,
  count,
  children,
}: {
  /** Any date in the month, "YYYY-MM-DD". */
  month: string;
  count: number;
  children: ReactNode;
}) {
  const t = useTranslations("ReportTimeline");
  const locale = useLocale() as Locale;
  const label = formatCalendarMonth(month, locale);

  return (
    <section aria-label={label}>
      <div className="flex items-center justify-between gap-3 border-y border-border bg-surface-secondary px-4 md:px-6 py-2.5 first:border-t-0">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-heading">
          {label}
        </h3>
        <span className="text-xs text-muted">{t("monthCount", { count })}</span>
      </div>
      <ol className="flex flex-col">{children}</ol>
    </section>
  );
}
