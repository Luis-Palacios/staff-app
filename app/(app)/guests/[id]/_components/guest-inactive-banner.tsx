import type { GuestDetail } from "@/api/guests-api/types";
import type { ReactNode } from "react";

import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";

import { formatCalendarDate } from "@/lib/format-date";

// Under the tabs of an inactive guest, on the Profile only. The reason is private (rule 9): the API
// sends it only to callers with `guests: deactivate`, so without one it's left out of the line.
export function GuestInactiveBanner({
  guest,
  action,
}: {
  guest: GuestDetail;
  /** *Reactivate…*, for callers with `guests: reactivate`. */
  action?: ReactNode;
}) {
  const t = useTranslations("GuestInactiveBanner");
  const tReason = useTranslations("GuestInactiveReason");
  const locale = useLocale();
  const date = guest.inactiveSince
    ? formatCalendarDate(guest.inactiveSince, locale)
    : "";

  return (
    <section
      aria-labelledby="inactive-banner-title"
      className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-4 rounded-card border border-border bg-surface-secondary px-[22px] py-[18px]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface">
        <ArchiveBoxIcon
          aria-hidden="true"
          className="size-[22px] text-muted"
          strokeWidth={1.7}
        />
      </span>
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
        <h2
          className="text-base font-semibold text-heading"
          id="inactive-banner-title"
        >
          {t("title", { name: guest.name })}
        </h2>
        <p className="text-sm leading-[1.55] text-muted">
          {guest.inactiveReason
            ? t.rich("body", {
                date,
                reason: tReason(guest.inactiveReason),
                strong: (chunks) => (
                  <strong className="font-semibold text-heading">
                    {chunks}
                  </strong>
                ),
              })
            : t("bodyNoReason", { date })}
        </p>
      </div>
      {action}
    </section>
  );
}
