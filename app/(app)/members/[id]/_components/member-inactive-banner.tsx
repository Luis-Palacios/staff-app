import type { MemberDetail } from "@/api/members-api/types";

import { NoSymbolIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";

import { formatCalendarDate } from "@/lib/format-date";

// Under the header of an inactive member. The reason is private (rule 5): the API sends it only to
// callers with `members: setStatus`, so without one the banner says when they left and no more.
export function MemberInactiveBanner({ member }: { member: MemberDetail }) {
  const t = useTranslations("MemberInactiveBanner");
  const tReason = useTranslations("MemberStatus.reason");
  const locale = useLocale();
  const date = member.inactiveSince
    ? formatCalendarDate(member.inactiveSince, locale)
    : "";

  return (
    <section
      aria-labelledby="inactive-banner-title"
      className="mb-5 flex flex-wrap items-start gap-4 rounded-card border border-border bg-surface-secondary px-6 py-5"
    >
      <NoSymbolIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-muted"
        strokeWidth={1.8}
      />
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
        <h2
          className="text-[15px] font-semibold text-heading"
          id="inactive-banner-title"
        >
          {t("title", { name: member.name })}
        </h2>
        <p className="text-sm leading-[1.55] text-muted">
          {member.inactiveReason
            ? t.rich("body", {
                date,
                reason: tReason(member.inactiveReason),
                strong: (chunks) => (
                  <strong className="font-semibold text-heading">
                    {chunks}
                  </strong>
                ),
              })
            : t("bodyNoReason", { date })}
        </p>
      </div>
    </section>
  );
}
