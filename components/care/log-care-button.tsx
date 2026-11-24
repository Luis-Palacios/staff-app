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

import { showToast } from "@/components/toast-host";

/** What the button opens: a new entry, or one of the caller's own entries. */
export type LogCareTarget =
  | { type: "new" }
  | { type: "edit"; entry: CareLogEntry }
  | { type: "complete"; entry: CareLogEntry };

type Variant = "primary" | "outline" | "link" | "record";

/**
 * A trigger for the care log form with the toast, the page refresh and the focus return that
 * follow a save. It lives in server-rendered pages (dashboards, report detail) and client rows
 * (the timeline), so it takes plain props. `variant`: `primary` is the timeline header's button,
 * `record` the amber-row *Record how it went* button, `link` the underlined *Edit*.
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
}: {
  target?: LogCareTarget;
  variant?: Variant;
  label: string;
  ariaLabel?: string;
  /** The church's today, "YYYY-MM-DD". */
  today: string;
  people?: CareLogPerson[];
  source?: CareLogSourceInfo;
  className?: string;
  withIcon?: boolean;
}) {
  const t = useTranslations("CareLog");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  function changeOpen(next: boolean) {
    setOpen(next);

    // The dialog restores focus itself; this covers a trigger that re-rendered under it.
    if (!next) window.requestAnimationFrame(() => trigger.current?.focus());
  }

  function saved(what: CareLogSaved) {
    const message = {
      logged: t("toastLogged"),
      planned: t("toastPlanned"),
      updated: t("toastUpdated"),
      completed: t("toastCompleted"),
      cancelled: t("toastCancelled"),
    }[what];

    changeOpen(false);
    showToast(message);
    router.refresh();
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
      {open && (
        <CareLogForm
          initialPeople={people}
          isOpen={open}
          mode={target}
          source={source}
          today={today}
          onOpenChange={changeOpen}
          onSaved={saved}
        />
      )}
    </>
  );
}
