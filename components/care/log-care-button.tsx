"use client";

import type { CareLogEntry } from "@/api/care-log-api/types";
import type {
  CareLogPerson,
  CareLogSaved,
  CareLogSourceInfo,
} from "./care-log-form";
import type { ReactNode } from "react";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { CareLogForm } from "./care-log-form";
import { showPlanSavedToast } from "./plan-saved-toast";

import { showToast } from "@/components/toast-host";

/** Long enough for `router.refresh()` to land and replace the rows. */
const FOCUS_FALLBACK_MS = 900;

/** What the form opens on: a new entry, or one of the caller's own entries. */
export type LogCareTarget =
  | { type: "new" }
  | { type: "edit"; entry: CareLogEntry }
  | { type: "complete"; entry: CareLogEntry };

/**
 * The care log form with what follows a save: the toast and a refresh of the page's data. The
 * opener (a button, a menu item) owns `open` and gives its own control the focus back when
 * `onOpenChange(false)` says the form is gone. It mounts only while open, so every opening starts
 * from a clean form.
 */
export function LogCareDialog({
  open,
  onOpenChange,
  target = { type: "new" },
  today,
  people,
  source,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a save went through (the form is closed and the page is refreshing). */
  onSaved?: () => void;
  target?: LogCareTarget;
  /** The church's today, "YYYY-MM-DD". */
  today: string;
  people?: CareLogPerson[];
  source?: CareLogSourceInfo;
}) {
  const t = useTranslations("CareLog");
  const router = useRouter();

  if (!open) return null;

  function saved(what: CareLogSaved, entry?: CareLogEntry) {
    const message = {
      logged: t("toastLogged"),
      planned: t("toastPlanned"),
      updated: t("toastUpdated"),
      completed: t("toastCompleted"),
      cancelled: t("toastCancelled"),
    }[what];

    onOpenChange(false);

    // A new plan offers *Add to calendar* in its toast (rule 47); every other save just says so.
    if (what === "planned" && entry) showPlanSavedToast(entry);
    else showToast(message);

    router.refresh();
    onSaved?.();
  }

  return (
    <CareLogForm
      isOpen
      initialPeople={people}
      mode={target}
      source={source}
      today={today}
      onOpenChange={onOpenChange}
      onSaved={saved}
    />
  );
}

type Variant = "primary" | "outline" | "link" | "record";

/**
 * A trigger for the care log form. It lives in server-rendered pages (dashboards, report detail)
 * and client rows (the timeline), so it takes plain props. `variant`: `primary` is the timeline
 * header's button, `record` the *Record how it went* button of a plan, `link` the underlined *Edit*.
 */
export function LogCareButton({
  target = { type: "new" },
  variant = "primary",
  label,
  ariaLabel,
  today,
  people,
  source,
  className,
  withIcon = false,
  returnFocusId = "timeline-title",
}: {
  /** The heading that gets the focus if this button is gone after the save. */
  returnFocusId?: string;
  target?: LogCareTarget;
  variant?: Variant;
  label: string;
  ariaLabel?: string;
  today: string;
  people?: CareLogPerson[];
  source?: CareLogSourceInfo;
  className?: string;
  withIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  function changeOpen(next: boolean) {
    setOpen(next);

    if (next) return;

    // The dialog restores focus itself; this covers a trigger that re-rendered under it.
    window.requestAnimationFrame(() => trigger.current?.focus());
  }

  // *Record how it went* makes its own button disappear once the page refreshes. After a save,
  // when that leaves the focus nowhere, it goes to the heading of the block the button was in.
  function afterSave() {
    window.setTimeout(() => {
      const active = document.activeElement;

      if (active && active !== document.body) return;

      const heading = document.getElementById(returnFocusId);

      if (!heading) return;

      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }, FOCUS_FALLBACK_MS);
  }

  const icon: ReactNode = withIcon && (
    <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
  );

  return (
    <>
      {variant === "link" ? (
        <button
          ref={trigger}
          aria-label={ariaLabel}
          className={clsx(
            "inline-flex min-h-8 items-center text-[13.5px] font-semibold text-heading underline decoration-gold-500 underline-offset-4",
            className,
          )}
          type="button"
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      ) : (
        <Button
          ref={trigger}
          aria-label={ariaLabel}
          className={clsx(
            "font-semibold",
            variant === "primary" && "h-11 gap-2 px-4 text-[14.5px]",
            variant === "record" && "h-9 px-3.5 text-[13.5px]",
            className,
          )}
          variant={variant === "outline" ? "outline" : "primary"}
          onPress={() => setOpen(true)}
        >
          {icon}
          {label}
        </Button>
      )}
      <LogCareDialog
        open={open}
        people={people}
        source={source}
        target={target}
        today={today}
        onOpenChange={changeOpen}
        onSaved={afterSave}
      />
    </>
  );
}
