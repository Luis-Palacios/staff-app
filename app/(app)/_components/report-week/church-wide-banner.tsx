import type { NoMeetingWeek } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { getLocale, getTranslations } from "next-intl/server";

import { EditWeekReasonButton } from "./edit-week-reason-dialog";
import { UndoWeekButton } from "./undo-week-dialog";

import { card } from "@/components/primitives";
import { CalendarXIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { hasPermission } from "@/lib/auth/get-permissions";
import { formatChurchDateTime } from "@/lib/church-time";

/** Focused after a mark (stage 3's button) so the banner is what's read next. */
export const CHURCH_WIDE_BANNER_HEADING = "church-wide-banner";

const actionClass = "h-11 gap-2 px-4 font-semibold max-sm:flex-1";

/**
 * The week was marked church-wide: reason, who marked it and when, and **Edit reason** / **Undo**
 * for whoever may (`update` / `delete`). Between the week header and the pills.
 */
export async function ChurchWideBanner({
  week,
  weekEnd,
  heading,
  focusAfterUndo,
}: {
  week: NoMeetingWeek;
  weekEnd: string;
  /** "No meetings this week", "… next week" or "… that week". */
  heading: string;
  /** The week heading's id: the banner goes away after an undo. */
  focusAfterUndo: string;
}) {
  const [t, locale, canUpdate, canDelete] = await Promise.all([
    getTranslations("NoMeetingWeek"),
    getLocale(),
    hasPermission({ smallGroups: ["all"], smallGroupReports: ["update"] }),
    hasPermission({ smallGroups: ["all"], smallGroupReports: ["delete"] }),
  ]);
  const marked = {
    id: week.id,
    weekStart: week.weekStart,
    weekEnd,
    reason: week.reason,
    linkedCount: week.linkedCount,
  };

  return (
    <section
      aria-labelledby={CHURCH_WIDE_BANNER_HEADING}
      className={card({
        className:
          "flex flex-wrap items-center gap-x-6 gap-y-4 p-4 sm:px-[22px] sm:py-[18px]",
      })}
    >
      <div className="flex min-w-0 flex-[1_1_460px] gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-default text-foreground">
          <CalendarXIcon className="size-[22px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <StatusBadge className="self-start">{t("churchWide")}</StatusBadge>
          <h3
            className="mt-0.5 font-display text-[21px] font-medium leading-tight text-heading outline-none"
            id={CHURCH_WIDE_BANNER_HEADING}
            tabIndex={-1}
          >
            {heading}
          </h3>
          {week.reason ? (
            <p className="font-display text-[17px] italic leading-normal text-foreground">
              {t("quoted", { reason: week.reason })}
            </p>
          ) : (
            <p className="text-[14.5px] text-muted">{t("noReason")}</p>
          )}
          <p className="text-[13.5px] leading-normal text-muted">
            {t("markedBy", {
              count: week.linkedCount,
              name: week.createdBy.name,
              date: formatChurchDateTime(week.createdAt, locale as Locale),
            })}
          </p>
        </div>
      </div>
      {(canUpdate || canDelete) && (
        <div className="flex flex-wrap gap-2.5 max-sm:basis-full">
          {canUpdate && (
            <EditWeekReasonButton className={actionClass} week={marked} />
          )}
          {canDelete && (
            <UndoWeekButton
              className={`${actionClass} text-danger`}
              focusAfter={focusAfterUndo}
              week={marked}
            />
          )}
        </div>
      )}
    </section>
  );
}
