"use client";

import type { CareLogPerson, CareLogSourceInfo } from "./care-log-form";

import {
  EllipsisHorizontalIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Dropdown } from "@heroui/react";
import clsx from "clsx";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { LogCareDialog } from "./log-care-button";

/**
 * The ⋯ care menu of a report row, a section or a thread (the `CareMenu` board). Part 1 has one
 * item, *Log care*, which opens the care log form with *From* and the people filled in. Part 2
 * adds *Start care* and *Add to care…* to this same menu.
 */
export function CareMenu({
  ariaLabel,
  description,
  people,
  source,
  today,
  size = "table",
  className,
}: {
  /** "More actions for Lucía". */
  ariaLabel: string;
  /** The item's second line: "A call, message, meeting or visit about Lucía". */
  description: string;
  people: CareLogPerson[];
  source: CareLogSourceInfo;
  today: string;
  size?: "table" | "card" | "inline";
  className?: string;
}) {
  const t = useTranslations("CareLog");
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  function changeOpen(next: boolean) {
    setOpen(next);

    // The menu has closed by now and took the focus with it: put it back on the ⋯ button.
    if (!next) window.requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger
          ref={trigger}
          aria-label={ariaLabel}
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-heading hover:bg-surface-secondary aria-expanded:border-accent aria-expanded:bg-surface-secondary data-pressed:transform-none",
            size === "card" ? "size-11" : "size-10",
            className,
          )}
        >
          <EllipsisHorizontalIcon
            aria-hidden="true"
            className="size-[18px]"
            strokeWidth={2}
          />
        </Dropdown.Trigger>
        <Dropdown.Popover
          className="w-[300px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-overlay-border bg-surface p-0 shadow-overlay-menu"
          offset={8}
          placement="bottom end"
        >
          <Dropdown.Menu aria-label={t("log")} className="gap-0 p-1.5">
            <Dropdown.Item
              className="min-h-0 items-start gap-3 rounded-[10px] px-3 py-2.5 data-focused:bg-surface-secondary data-hovered:bg-surface-secondary"
              textValue={t("log")}
              onAction={() => setOpen(true)}
            >
              <PencilIcon
                aria-hidden="true"
                className="mt-px size-[18px] shrink-0 text-heading"
                strokeWidth={1.7}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[14.5px] font-semibold text-heading">
                  {t("log")}
                </span>
                <span className="text-[12.5px] leading-[1.4] text-muted">
                  {description}
                </span>
              </span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
      <LogCareDialog
        open={open}
        people={people}
        source={source}
        today={today}
        onOpenChange={changeOpen}
      />
    </>
  );
}
