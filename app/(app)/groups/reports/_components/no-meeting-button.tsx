"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  NoMeetingDialog,
  type NoMeetingKind,
  type NoMeetingTarget,
} from "./no-meeting-dialog";

import { showToast } from "@/components/toast-host";

const FOCUSABLE = "a[href], button:not([disabled])";

/** The next row's first control, so focus has somewhere to land when this row goes away. */
function nextFocusTarget(from: HTMLElement | null): HTMLElement | null {
  const row = from?.closest("li, tr, article");
  const sibling = row?.nextElementSibling ?? row?.previousElementSibling;

  return sibling?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
}

/**
 * A trigger for the no-meeting dialog, with the toast and the refresh that follow a save. It lives
 * in server-rendered rows (dashboard, group page) and client ones (the list), so it takes plain
 * props. `variant="link"` is the underlined text link of the dashboard box; `"button"` the
 * secondary button of a list row.
 */
export function NoMeetingButton({
  kind = "mark",
  target,
  variant,
  label,
  ariaLabel,
  className,
}: {
  kind?: NoMeetingKind;
  target: NoMeetingTarget;
  variant: "link" | "button";
  label: string;
  ariaLabel?: string;
  className?: string;
}) {
  const t = useTranslations("NoMeetingDialog");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  function done() {
    const next = nextFocusTarget(trigger.current);

    showToast(kind === "edit" ? t("savedToast") : t("markedToast"));
    router.refresh();

    // The row leaves "not filed" once the refresh lands.
    window.setTimeout(() => {
      if (next?.isConnected) next.focus();
    }, 600);
  }

  return (
    <>
      {variant === "link" ? (
        <button
          ref={trigger}
          aria-label={ariaLabel}
          className={clsx(
            "shrink-0 rounded-sm font-semibold underline underline-offset-2 outline-none focus-visible:shadow-[var(--shadow-focus)]",
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
          className={clsx("font-semibold", className)}
          size="sm"
          variant="outline"
          onPress={() => setOpen(true)}
        >
          {label}
        </Button>
      )}
      <NoMeetingDialog
        isOpen={open}
        kind={kind}
        target={target}
        onDone={done}
        onOpenChange={setOpen}
      />
    </>
  );
}
