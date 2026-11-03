"use client";

import type { SaveState } from "@/app/(app)/groups/reports/_lib/report-autosave";
import type { Locale } from "@/lib/locale-shared";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";

import { textLink } from "@/components/primitives";
import { formatLocalTime } from "@/lib/format-date";

const TONE = {
  saved: "bg-success-soft text-success-soft-foreground",
  saving: "bg-surface-secondary text-muted",
  offline: "bg-warning-soft text-warning-soft-foreground",
  error: "bg-danger-soft text-danger-soft-foreground",
  held: "bg-danger-soft text-danger-soft-foreground",
  conflict: "bg-danger-soft text-danger-soft-foreground",
} as const;

const ICON = {
  saved: CheckCircleIcon,
  saving: ArrowPathIcon,
  offline: DevicePhoneMobileIcon,
  error: ExclamationCircleIcon,
  held: ExclamationCircleIcon,
  conflict: ExclamationCircleIcon,
} as const;

/** The long and short wording of a save state (the short one is the phone chip's). */
function useSaveWords(state: SaveState, submitted: boolean) {
  const t = useTranslations("ReportForm");
  const locale = useLocale() as Locale;

  switch (state.status) {
    case "saved": {
      if (!state.savedAt) {
        return { long: t("saveShortSaved"), short: t("saveShortSaved") };
      }

      const time = formatLocalTime(state.savedAt, locale);

      return {
        long: submitted
          ? t("saveSaved", { time })
          : t("saveSavedDraft", { time }),
        short: t("saveShortSaved"),
      };
    }
    case "saving":
      return { long: t("saveSaving"), short: t("saveSaving") };
    case "offline":
      return { long: t("saveOffline"), short: t("saveShortOffline") };
    case "error":
      return { long: t("saveError"), short: t("saveShortError") };
    case "held":
      return { long: t("saveHeld"), short: t("saveShortError") };
    case "conflict": {
      const name = state.conflict.lastEditedBy?.name;

      return {
        long: name ? t("saveConflict", { name }) : t("saveConflictSomeone"),
        short: t("saveShortError"),
      };
    }
  }
}

/**
 * Where the latest change is (auto-save rule 8). `pill`: desktop, at the right of the breadcrumb
 * row, with the long text and **Retry** after an error. `chip`: the phone's top bar, short text,
 * with the long text as its accessible name. Both are polite live regions; only one is displayed
 * at a time, so only one is announced.
 */
export function SaveStatus({
  state,
  submitted,
  variant,
  className,
  onRetry,
}: {
  state: SaveState;
  /** A submitted report says "Saved"; a draft "Draft saved". */
  submitted: boolean;
  variant: "pill" | "chip";
  className?: string;
  onRetry: () => void;
}) {
  const t = useTranslations("ReportForm");
  const words = useSaveWords(state, submitted);
  const Icon = ICON[state.status];
  const icon = (
    <Icon
      aria-hidden="true"
      className={clsx(
        "size-4 shrink-0",
        state.status === "saving" && "motion-safe:animate-spin",
      )}
      strokeWidth={1.8}
    />
  );

  if (variant === "chip") {
    return (
      <span
        aria-label={words.long}
        aria-live="polite"
        className={clsx(
          "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-semibold",
          TONE[state.status],
          className,
        )}
        role="status"
      >
        {icon}
        <span aria-hidden="true">{words.short}</span>
      </span>
    );
  }

  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <span
        aria-live="polite"
        className={clsx(
          "inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3 text-[13.5px] font-semibold",
          TONE[state.status],
        )}
        role="status"
      >
        {icon}
        {words.long}
      </span>
      {state.status === "error" && (
        <button
          className={textLink({
            className: "min-h-8 text-[13.5px] outline-none",
          })}
          type="button"
          onClick={onRetry}
        >
          {t("retry")}
        </button>
      )}
    </span>
  );
}

/** Draft (hollow dot, in progress) or Submitted (filled dot) next to the title. */
export function ReportStatusPill({
  submitted,
  className,
}: {
  submitted: boolean;
  className?: string;
}) {
  const t = useTranslations("ReportForm");

  return (
    <span
      className={clsx(
        "inline-flex h-7 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[13px] font-semibold",
        submitted
          ? "bg-success-soft text-success-soft-foreground"
          : "bg-accent-soft text-accent-soft-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "size-[7px] rounded-full border-[1.5px] border-current",
          submitted ? "bg-current" : "bg-transparent",
        )}
      />
      {submitted ? t("submittedPill") : t("draftPill")}
    </span>
  );
}
