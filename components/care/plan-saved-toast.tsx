"use client";

import type { CareLogEntry } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AddToCalendar } from "./add-to-calendar";

import { formatCalendarRowDate } from "@/lib/format-date";
import { formatCareTime, isPlannableKind } from "@/lib/care-log-format";

const EVENT = "ekk:plan-saved";

/** After a new plan is saved: offer *Add to calendar* once (rule 47). */
export function showPlanSavedToast(entry: CareLogEntry) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: entry }));
}

/**
 * The toast of a saved plan, with *Add to calendar* in it. Unlike the other toasts it stays until
 * it is closed, since the menu in it takes a moment. Mounted once in the shell.
 */
export function PlanSavedToast() {
  const t = useTranslations("CareLog");
  const locale = useLocale() as Locale;
  const [entry, setEntry] = useState<CareLogEntry | null>(null);

  useEffect(() => {
    function onPlan(event: Event) {
      setEntry((event as CustomEvent<CareLogEntry>).detail);
    }

    window.addEventListener(EVENT, onPlan);

    return () => window.removeEventListener(EVENT, onPlan);
  }, []);

  if (!entry || !isPlannableKind(entry.kind)) return null;

  const date = formatCalendarRowDate(entry.occurredOn, locale);
  const when = entry.occurredAtTime
    ? t("calendar.whenAt", {
        date,
        time: formatCareTime(entry.occurredAtTime, locale),
      })
    : date;

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-50 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-navy-900 py-2.5 pl-4 pr-2.5 text-sm font-semibold text-white shadow-overlay-menu sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-[min(560px,calc(100vw-3rem))]"
      role="status"
    >
      <span className="min-w-[min(200px,100%)] flex-1">
        {t("calendar.planSaved", { kind: entry.kind, when })}
      </span>
      <AddToCalendar entry={entry} placement="top end" tone="onDark" />
      <button
        aria-label={t("calendar.dismiss")}
        className="flex size-11 items-center justify-center rounded-[9px] text-white hover:bg-white/10"
        type="button"
        onClick={() => setEntry(null)}
      >
        <XMarkIcon aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
