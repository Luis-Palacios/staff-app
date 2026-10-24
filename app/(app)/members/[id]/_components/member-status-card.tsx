import type { StatusHistoryEntry } from "@/app/(app)/members/_lib/load-status-history";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";

import { InactiveReasonChip } from "@/app/(app)/members/_components/inactive-reason-chip";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card } from "@/components/primitives";
import { formatCalendarDate } from "@/lib/format-date";

// Status history, newest first. Only rendered for callers with `members: setStatus`: the reasons
// and notes in it are private (rule 5), and the API answers 403 to anyone else.
export function MemberStatusHistoryCard({
  history,
}: {
  history: StatusHistoryEntry[];
}) {
  const t = useTranslations("MemberStatusCard");
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
        {t("historyTitle")}
      </DetailCardHeading>
      <ol className="flex flex-col divide-y divide-separator">
        {history.map((change) => (
          <li
            key={change.createdAt}
            className="flex flex-col gap-1 py-3 first:pt-0"
          >
            <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-heading">
              {change.status === "inactive"
                ? t("markedInactive")
                : t("reactivated")}
              <InactiveReasonChip reason={change.reason} />
            </span>
            <span className="text-[13px] text-muted">
              {t("by", {
                date: formatCalendarDate(change.effectiveDate, locale),
                name: change.changedBy ?? t("someone"),
              })}
            </span>
            {change.note && (
              <p className="break-words text-sm text-muted">{change.note}</p>
            )}
          </li>
        ))}
      </ol>
      <p className="flex items-center gap-2 border-t border-separator pt-3 text-[13px] text-muted">
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
