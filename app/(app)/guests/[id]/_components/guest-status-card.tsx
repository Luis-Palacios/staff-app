import type { GuestStatusHistoryEntry } from "@/app/(app)/guests/_lib/load-guest-status-history";

import {
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { GuestInactiveReasonChip } from "@/components/inactive-reason-chip";
import { card } from "@/components/primitives";
import { formatCalendarDate } from "@/lib/format-date";

// Status history, newest first. The API sends it only to callers with `guests: deactivate` (rule 9).
export function GuestStatusHistoryCard({
  history,
}: {
  history: GuestStatusHistoryEntry[];
}) {
  const t = useTranslations("GuestStatusCard");
  const locale = useLocale();

  return (
    <section
      aria-labelledby="status-history-title"
      className={card({
        className: "flex min-w-0 flex-col gap-3 px-6 pb-4 pt-5",
      })}
    >
      <DetailCardHeading
        eyebrow={t("historyEyebrow")}
        id="status-history-title"
      >
        {t("history")}
      </DetailCardHeading>
      <ol className="flex flex-col divide-y divide-separator">
        {history.map((change) => {
          const Icon =
            change.status === "inactive" ? ArchiveBoxIcon : ArrowUturnLeftIcon;

          return (
            <li key={change.createdAt} className="flex gap-3.5 py-3.5">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-default">
                <Icon
                  aria-hidden="true"
                  className="size-[17px] text-muted"
                  strokeWidth={1.7}
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-heading">
                  {change.status === "inactive"
                    ? t("markedInactive")
                    : t("reactivated")}
                  <GuestInactiveReasonChip reason={change.reason} />
                </span>
                <span className="text-[13px] text-muted">
                  {t("by", {
                    date: formatCalendarDate(change.effectiveDate, locale),
                    name: change.changedBy ?? t("someone"),
                  })}
                </span>
                {change.note && (
                  <p className="mt-1 break-words text-sm leading-[1.55] text-muted">
                    {change.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="flex items-center gap-2 border-t border-separator pt-3 text-[13px] leading-normal text-muted">
        <LockClosedIcon
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.8}
        />
        {t("privateHint")}
      </p>
    </section>
  );
}
