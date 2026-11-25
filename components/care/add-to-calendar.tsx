"use client";

import type { CareLogEntry } from "@/api/care-log-api/types";
import type { CalendarText } from "@/lib/care-calendar-event";

import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  DocumentPlusIcon,
  EyeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Dropdown } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import {
  buildCalendarEvent,
  buildIcs,
  calendarTitle,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/lib/care-calendar-event";
import { useChurchTimeZone } from "@/lib/contexts/user-context";
import { isPlannableKind } from "@/lib/care-log-format";

type Placement = "bottom start" | "bottom end" | "top start" | "top end";

/** The words an event is made of, in the viewer's language (rule 48). */
export function useCalendarText(
  entry: Pick<CareLogEntry, "kind">,
): CalendarText {
  const t = useTranslations("CareLog");

  return {
    kind: t(`kinds.${entry.kind}`),
    privateTitle: isPlannableKind(entry.kind)
      ? t(`calendar.privateTitles.${entry.kind}`)
      : t("calendar.privateTitles.visit"),
    description: t("calendar.description"),
    online: t("modeOnline"),
  };
}

/**
 * *Add to calendar* (care spec rules 47–49): a menu with Google Calendar, Outlook and a `.ics`
 * download, built here from the entry the page already has: nothing is stored and no server is
 * called. The menu says what the calendar will show and that it is a copy, not a sync.
 * `variant`: `button` is the labelled outline button (timeline row, entry page, panel), `icon` the
 * 44 px icon button of a *Coming up* row.
 */
export function AddToCalendar({
  entry,
  variant = "button",
  ariaLabel,
  placement = "bottom start",
  tone = "default",
  className,
}: {
  entry: CareLogEntry;
  variant?: "button" | "icon";
  /** `onDark` is for the navy toast. */
  tone?: "default" | "onDark";
  /** The icon button's name: "Add to calendar: Call, Óscar Arce". */
  ariaLabel?: string;
  placement?: Placement;
  className?: string;
}) {
  const t = useTranslations("CareLog");
  const text = useCalendarText(entry);
  const timeZone = useChurchTimeZone();
  const title = calendarTitle(entry, text);

  function eventFor() {
    return buildCalendarEvent(entry, text, {
      url: `${window.location.origin}/care-log/${entry.id}`,
      host: window.location.hostname,
      timeZone,
    });
  }

  function openLink(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function download() {
    const file = new Blob([buildIcs(eventFor(), new Date())], {
      type: "text/calendar;charset=utf-8",
    });
    const href = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = href;
    link.download = `care-log-${entry.id}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  const itemClass =
    "min-h-12 items-center gap-3 rounded-[10px] px-2.5 py-1.5 data-focused:bg-surface-secondary data-hovered:bg-surface-secondary";
  const tile =
    "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent-soft-foreground";

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={variant === "icon" ? ariaLabel : undefined}
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-[10px] border data-pressed:transform-none",
          tone === "onDark"
            ? "border-white/30 bg-white/10 text-white hover:bg-white/15 aria-expanded:bg-white/15"
            : "bg-surface text-heading hover:bg-surface-secondary aria-expanded:bg-surface-secondary",
          tone === "default" &&
            (variant === "icon" ? "border-border" : "border-field-border"),
          variant === "icon"
            ? "size-11"
            : "h-9 gap-[7px] px-3 text-[13.5px] font-semibold",
          className,
        )}
      >
        <CalendarDaysIcon
          aria-hidden="true"
          className={variant === "icon" ? "size-[18px]" : "size-[15px]"}
          strokeWidth={1.8}
        />
        {variant === "button" && (
          <>
            {t("calendar.add")}
            <ChevronDownIcon
              aria-hidden="true"
              className={clsx(
                "size-3.5",
                tone === "onDark" ? "text-white/75" : "text-muted",
              )}
              strokeWidth={2}
            />
          </>
        )}
      </Dropdown.Trigger>
      <Dropdown.Popover
        className="w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[14px] border border-overlay-border bg-surface p-0 shadow-overlay-menu"
        offset={8}
        placement={placement}
      >
        <Dropdown.Menu aria-label={t("calendar.add")} className="gap-0.5 p-1.5">
          <Dropdown.Item
            className={itemClass}
            id="google"
            textValue={`Google Calendar ${t("calendar.newTab")}`}
            onAction={() => openLink(googleCalendarUrl(eventFor()))}
          >
            <span className={tile}>
              <CalendarDaysIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.7}
              />
            </span>
            <span className="flex-1 text-[14.5px] font-semibold text-heading">
              {t("calendar.google")}
            </span>
            <ArrowTopRightOnSquareIcon
              aria-hidden="true"
              className="size-[15px] text-muted"
              strokeWidth={1.8}
            />
          </Dropdown.Item>
          <Dropdown.Item
            className={itemClass}
            id="outlook"
            textValue={`Outlook ${t("calendar.newTab")}`}
            onAction={() => openLink(outlookCalendarUrl(eventFor()))}
          >
            <span className={tile}>
              <CalendarDaysIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.7}
              />
            </span>
            <span className="flex flex-1 flex-col gap-px">
              <span className="text-[14.5px] font-semibold text-heading">
                {t("calendar.outlook")}
              </span>
              <span className="text-[12.5px] text-muted">
                {t("calendar.outlookSub")}
              </span>
            </span>
            <ArrowTopRightOnSquareIcon
              aria-hidden="true"
              className="size-[15px] text-muted"
              strokeWidth={1.8}
            />
          </Dropdown.Item>
          <Dropdown.Item
            className={itemClass}
            id="ics"
            textValue={t("calendar.ics")}
            onAction={download}
          >
            <span className={tile}>
              <DocumentPlusIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.7}
              />
            </span>
            <span className="flex flex-1 flex-col gap-px">
              <span className="text-[14.5px] font-semibold text-heading">
                {t("calendar.ics")}
              </span>
              <span className="text-[12.5px] text-muted">
                {t("calendar.icsSub")}
              </span>
            </span>
            <ArrowDownTrayIcon
              aria-hidden="true"
              className="size-[15px] text-muted"
              strokeWidth={1.8}
            />
          </Dropdown.Item>
        </Dropdown.Menu>
        <div className="flex flex-col gap-2 border-t border-separator bg-surface-secondary px-4 pb-3.5 pt-3">
          <p className="flex gap-2 text-[13px] leading-[1.45] text-foreground">
            <InformationCircleIcon
              aria-hidden="true"
              className="mt-px size-4 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            {t("calendar.copyNote")}
          </p>
          <p className="flex gap-2 text-[13px] leading-[1.45] text-muted">
            <EyeIcon
              aria-hidden="true"
              className="mt-px size-4 shrink-0"
              strokeWidth={1.8}
            />
            {entry.visibility === "private"
              ? t("calendar.showsPrivate", { title })
              : t("calendar.shows", { title })}
          </p>
        </div>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
