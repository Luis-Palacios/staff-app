import type { SmallGroupDetail } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { listSmallGroupReports } from "@/api/small-groups-api/client";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarMediumDate } from "@/lib/format-date";

const RECENT = 4;

/**
 * "Recent meetings" on Group detail: the last four meetings (filed reports and not-filed ones),
 * each linking to its report, and **New report** when the caller can file one for an open group.
 * A failed read says so in the card instead of taking the page down.
 */
export async function GroupReportsCard({
  group,
  canSubmit,
}: {
  group: SmallGroupDetail;
  /** `reportAccess(...).canSubmit`: a linked member with access to groups (rule 5). */
  canSubmit: boolean;
}) {
  const [t, tList, locale] = await Promise.all([
    getTranslations("GroupReportsCard"),
    getTranslations("ReportsList"),
    getLocale(),
  ]);
  const items = await listSmallGroupReports({
    smallGroupId: group.id,
    pageSize: RECENT,
  }).then(
    (list) => list.items,
    () => null,
  );
  const open = group.closedAt === null;

  return (
    <section className={card({ className: "flex min-w-0 flex-col" })}>
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <DetailCardHeading eyebrow={t("eyebrow")}>
          {t("title")}
        </DetailCardHeading>
        <NextLink
          className={textLink({ className: "text-sm" })}
          href={`/groups/reports?groupId=${group.id}`}
        >
          {t("viewAll")}
        </NextLink>
      </div>

      {items === null ? (
        <p className="px-6 py-4 text-sm text-muted">{t("loadFailed")}</p>
      ) : items.length === 0 ? (
        <p className="px-6 py-4 text-sm text-muted">{t("noneYet")}</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-separator border-t border-separator">
          {items.map((item) => {
            const date = formatCalendarMediumDate(
              item.meetingDate,
              locale as Locale,
            );
            const row = (
              <>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-heading">
                    {date}
                  </span>
                  <span className="text-[13px] text-muted">
                    {item.kind === "report"
                      ? t("counts", {
                          attended: item.attendedGroupCount,
                          total: item.rosterCount,
                          church: item.attendedChurchCount,
                        })
                      : t("missing")}
                  </span>
                </span>
                <StatusBadge
                  tone={item.kind === "report" ? "success" : "warning"}
                  variant={item.kind === "report" ? "solid-dot" : "ring-dot"}
                >
                  {item.kind === "report" ? tList("filed") : tList("notFiled")}
                </StatusBadge>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted"
                />
              </>
            );
            const rowClass =
              "flex items-center gap-3 px-6 py-3 outline-none transition-colors hover:bg-surface-secondary focus-visible:shadow-[var(--shadow-focus)]";

            if (item.kind === "report") {
              return (
                <li key={`report-${item.id}`}>
                  <NextLink
                    aria-label={t("openLabel", { date })}
                    className={rowClass}
                    href={`/groups/reports/${item.id}`}
                  >
                    {row}
                  </NextLink>
                </li>
              );
            }

            // A not-filed meeting links to filing it, when the caller can.
            return (
              <li key={`missing-${item.meetingDate}`}>
                {canSubmit && open ? (
                  <NextLink
                    aria-label={t("fileLabel", { date })}
                    className={rowClass}
                    href={`/groups/reports/new?groupId=${group.id}&date=${item.meetingDate}`}
                  >
                    {row}
                  </NextLink>
                ) : (
                  <div className={rowClass}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-6 pb-5 pt-1">
        {open ? (
          canSubmit && (
            <NextLink
              className={buttonVariants({
                variant: "primary",
                className: "mt-3 w-full gap-2 font-semibold",
              })}
              href={`/groups/reports/new?groupId=${group.id}`}
            >
              <PlusIcon
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.8}
              />
              {t("newReport")}
            </NextLink>
          )
        ) : (
          <p className="mt-3 text-[13px] text-muted">{t("closedNote")}</p>
        )}
      </div>
    </section>
  );
}
