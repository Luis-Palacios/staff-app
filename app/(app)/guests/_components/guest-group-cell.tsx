import type { GuestListItem } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { textLink } from "@/components/primitives";
import { formatCalendarDate } from "@/lib/format-date";

// Where a guest is: their group and since when, "Not in a group" with when and why they left, or
// for an inactive guest the date they left over the reason (private: empty without
// `guests: deactivate`).
export function GuestGroupCell({ guest }: { guest: GuestListItem }) {
  const t = useTranslations("GuestsBrowser");
  const tReason = useTranslations("GuestInactiveReason");
  const locale = useLocale() as Locale;
  const { currentGroup, lastGroup, inactiveSince, inactiveReason } = guest;

  if (guest.status === "inactive") {
    return (
      <span className="flex min-w-0 flex-col">
        {inactiveSince && (
          <span className="text-[14.5px] font-semibold text-heading">
            {t("left", { date: formatCalendarDate(inactiveSince, locale) })}
          </span>
        )}
        {inactiveReason && (
          <span className="text-[12.5px] text-muted">
            {tReason(inactiveReason)}
          </span>
        )}
      </span>
    );
  }

  if (currentGroup) {
    return (
      <span className="flex min-w-0 flex-col">
        <NextLink
          className={textLink({ className: "text-[14.5px] font-semibold" })}
          href={`/groups/${currentGroup.id}`}
        >
          {currentGroup.name}
        </NextLink>
        <span className="text-[12.5px] text-muted">
          {t("since", {
            date: formatCalendarDate(currentGroup.joinedAt, locale),
          })}
        </span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[14.5px] text-muted">{t("noGroup")}</span>
      {lastGroup && (
        <span className="text-[12.5px] text-muted">
          {lastGroup.leftReason
            ? t("leftWithReason", {
                date: formatCalendarDate(lastGroup.leftAt, locale),
                reason: t(`leftReason.${lastGroup.leftReason}`),
              })
            : t("left", { date: formatCalendarDate(lastGroup.leftAt, locale) })}
        </span>
      )}
    </span>
  );
}
