import type { GuestListItem } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

// Last time at a meeting: a success pill, or a warning pill when they have missed 2 or more in a row.
const MISSED_WARNING_FROM = 2;

export function GuestLastSeen({ guest }: { guest: GuestListItem }) {
  const t = useTranslations("GuestsBrowser");
  const locale = useLocale() as Locale;
  const { lastAttendedDate, missedStreak, lastGroup } = guest;

  // An inactive guest has no next meeting to miss: this column says where they last were.
  if (guest.status === "inactive") {
    return (
      <StatusBadge tone="neutral" variant="ring-dot">
        {lastGroup?.name ?? t("noGroup")}
      </StatusBadge>
    );
  }

  if (!lastAttendedDate) {
    return <span className="text-subtle">{t("neverSeen")}</span>;
  }

  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${lastAttendedDate}T00:00:00Z`));
  const missed = missedStreak !== null && missedStreak >= MISSED_WARNING_FROM;

  return (
    <span className="flex flex-col items-start gap-0.5">
      <StatusBadge
        tone={missed ? "warning" : "success"}
        variant={missed ? "ring-dot" : "solid-dot"}
      >
        {date}
      </StatusBadge>
      {missed && (
        <span className="text-[12.5px] text-muted">
          {t("missed", { count: missedStreak })}
        </span>
      )}
    </span>
  );
}
