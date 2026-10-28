"use client";

import type { PersonTimeline } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { TimelineRange, TimelineRangeKind } from "@/lib/timeline-range";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AdjustmentsHorizontalIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Button, Label, ListBox, Modal, Select } from "@heroui/react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";

import { ReportTimeline } from "./report-timeline";

import { GuestDatePicker } from "@/app/(app)/groups/[id]/_components/guest-date-picker";
import { EmptyState } from "@/components/empty-state";
import { formatCalendarMediumDate } from "@/lib/format-date";
import { firstNameOf } from "@/lib/report-items";
import { extendRange, isValidRange } from "@/lib/timeline-range";

type TypeFilter = "all" | "notes" | "prayer" | "praise" | "followUp";

const TYPES: TypeFilter[] = ["all", "notes", "prayer", "praise", "followUp"];
const ALL_GROUPS = "all";
const PRESETS: Exclude<TimelineRangeKind, "custom">[] = ["3m", "6m", "year"];

const RANGE_LABEL = {
  "3m": "range3m",
  "6m": "range6m",
  year: "rangeYear",
  custom: "rangeCustom",
} as const;

/**
 * The date range as "Jul 16 – Oct 15, 2026". Each end is formatted alone: `formatRange` spaces its
 * dash differently in Node and in the browser, which breaks hydration.
 */
function formatRange(from: string, to: string, locale: Locale): string {
  const format = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${iso}T00:00:00Z`));

  return `${format(from)} – ${format(to)}`;
}

/**
 * The Timeline tab's body (rules 21–22): filters, type chips, summary, rows and footer. The date
 * range and group are in the URL and rendered on the server (a change navigates and keeps the
 * scroll); the type chips are page state over the rows already here.
 */
export function TimelineBoard({
  timeline,
  range,
  groupId,
  today,
  viewer,
  kind,
}: {
  timeline: PersonTimeline;
  range: TimelineRange;
  groupId: number | null;
  /** The church's today, the latest date a range can end on. */
  today: string;
  viewer: "elder" | "leader";
  kind: "member" | "guest";
}) {
  const t = useTranslations("ReportTimeline");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<TypeFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickingCustom, setPickingCustom] = useState(false);
  const [draft, setDraft] = useState({ from: range.from, to: range.to });
  const [rangeError, setRangeError] = useState(false);
  const name = firstNameOf(timeline.person.name);
  const showCustom = range.kind === "custom" || pickingCustom;
  const group = timeline.groups.find((item) => item.id === groupId);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(changes)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }

    const search = params.toString();

    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    });
  }

  function pickPreset(next: TimelineRangeKind) {
    setRangeError(false);

    if (next === "custom") {
      // The dates only reach the URL once both are valid.
      setPickingCustom(true);
      setDraft({ from: range.from, to: range.to });
      update({ range: "custom", from: range.from, to: range.to });

      return;
    }

    setPickingCustom(false);
    update({ range: next === "3m" ? null : next, from: null, to: null });
  }

  function changeDates(next: { from: string; to: string }) {
    setDraft(next);

    if (!isValidRange(next.from, next.to, today)) {
      setRangeError(true);

      return;
    }

    setRangeError(false);
    update({ range: "custom", from: next.from, to: next.to });
  }

  function showMoreMonths() {
    const next = extendRange(range);

    if (!next) return;

    setDraft({ from: next.from, to: next.to });
    update({ range: "custom", from: next.from, to: next.to });
  }

  const rows = timeline.rows.filter((row) => {
    if (type === "all") return true;
    if (type === "notes") return row.observation !== null;

    return row.items.some((item) => item.section === type);
  });
  const typeCounts: Record<
    Exclude<TypeFilter, "all">,
    number
  > = timeline.counts;
  const typeLabel: Record<TypeFilter, string> = {
    all: t("typeAll"),
    notes: t("typeNotes"),
    prayer: t("typePrayer"),
    praise: t("typePraise"),
    followUp: t("typeFollowUp"),
  };
  const rangeText = formatRange(range.from, range.to, locale);
  const summary = t("summary", {
    count: rows.length,
    range: group ? `${rangeText} · ${group.name}` : rangeText,
  });
  const canShowMore =
    timeline.earliestDate !== null &&
    timeline.earliestDate < range.from &&
    extendRange(range) !== null;
  const endText =
    viewer === "leader"
      ? t("endLeader", { name })
      : kind === "guest" && timeline.earliestDate
        ? t("endGuest", {
            name,
            date: formatCalendarMediumDate(timeline.earliestDate, locale),
          })
        : t("endMember", { name });

  const rangeSelect = (
    <Select.Root
      className="w-full gap-1.5 md:w-[220px]"
      selectedKey={showCustom ? "custom" : range.kind}
      onSelectionChange={(key) => {
        if (key) pickPreset(key as TimelineRangeKind);
      }}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("dates")}
      </Label>
      <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {[...PRESETS, "custom" as const].map((key) => (
            <ListBox.Item key={key} id={key} textValue={t(RANGE_LABEL[key])}>
              {t(RANGE_LABEL[key])}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  );
  const groupSelect = (
    <Select.Root
      className="w-full gap-1.5 md:w-[260px]"
      selectedKey={group ? String(group.id) : ALL_GROUPS}
      onSelectionChange={(key) =>
        update({ group: !key || key === ALL_GROUPS ? null : String(key) })
      }
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("group")}
      </Label>
      <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={ALL_GROUPS} textValue={t("allGroups")}>
            {t("allGroups")}
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {timeline.groups.map((item) => (
            <ListBox.Item
              key={item.id}
              id={String(item.id)}
              textValue={item.name}
            >
              {item.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  );
  const customDates = showCustom && (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-[170px]">
          <GuestDatePicker
            isDisabled={false}
            label={t("from")}
            max={today}
            value={draft.from}
            onChange={(from) => changeDates({ ...draft, from })}
          />
        </div>
        <div className="w-full sm:w-[170px]">
          <GuestDatePicker
            isDisabled={false}
            label={t("to")}
            max={today}
            value={draft.to}
            onChange={(to) => changeDates({ ...draft, to })}
          />
        </div>
      </div>
      {rangeError && (
        <p className="text-[13px] text-danger" role="alert">
          {t("errorRange")}
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-4 px-6 pb-4">
        {/* md and up: every control in one row. */}
        <div className="hidden flex-wrap items-end gap-3 md:flex">
          {rangeSelect}
          {customDates}
          {timeline.groups.length > 0 && groupSelect}
        </div>

        {/* Below md: one Filters button with the current range and group under it. */}
        <Button
          className="h-auto min-h-12 w-full justify-start gap-3 px-3.5 py-2 text-left md:hidden"
          variant="outline"
          onPress={() => setSheetOpen(true)}
        >
          <AdjustmentsHorizontalIcon
            aria-hidden="true"
            className="size-5 shrink-0"
            strokeWidth={1.8}
          />
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold">{t("filters")}</span>
            <span className="truncate text-[13px] font-normal text-muted">
              {group ? `${rangeText} · ${group.name}` : rangeText}
            </span>
          </span>
        </Button>

        <div
          aria-label={t("title")}
          className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          role="group"
        >
          {TYPES.map((key) => {
            const pressed = type === key;

            return (
              <button
                key={key}
                aria-pressed={pressed}
                className={clsx(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors md:min-h-10",
                  pressed
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface text-heading hover:bg-default",
                )}
                type="button"
                onClick={() => setType(key)}
              >
                {typeLabel[key]}
                {key !== "all" && (
                  <span
                    className={clsx(
                      "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[12.5px] font-bold tabular-nums",
                      pressed
                        ? "bg-accent-foreground/20 text-accent-foreground"
                        : "bg-default text-foreground",
                    )}
                  >
                    {typeCounts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="text-[13px] text-muted" role="status">
          {summary}
        </p>
      </div>

      <div
        aria-busy={isPending}
        className={clsx("transition-opacity", isPending && "opacity-60")}
      >
        {rows.length === 0 ? (
          <div className="border-t border-separator px-6 py-8">
            <EmptyState as="h3" icon={ClockIcon} title={t("emptyTitle")}>
              {t("emptyBody")}
            </EmptyState>
          </div>
        ) : (
          <div className="border-t border-separator">
            <ReportTimeline timeline={{ person: timeline.person, rows }} />
          </div>
        )}
        <div className="flex flex-col items-start gap-3 border-t border-separator px-6 py-4">
          {canShowMore ? (
            <Button
              className="font-semibold"
              isPending={isPending}
              variant="outline"
              onPress={showMoreMonths}
            >
              {t("showMore")}
            </Button>
          ) : (
            timeline.earliestDate !== null && (
              <p className="text-[13px] text-muted">{endText}</p>
            )
          )}
          <p className="flex items-start gap-2 text-[13px] text-muted">
            <EyeIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
              strokeWidth={1.8}
            />
            {viewer === "elder"
              ? t("footElder", { name })
              : t("footLeader", { name })}
          </p>
        </div>
      </div>

      <Modal.Backdrop isOpen={sheetOpen} onOpenChange={setSheetOpen}>
        <Modal.Container placement="bottom" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="font-display text-2xl font-medium text-heading">
                {t("filters")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 overflow-visible p-1">
              <div
                aria-label={t("dates")}
                className="flex flex-col gap-2"
                role="group"
              >
                <span className="text-[13px] font-semibold text-heading">
                  {t("dates")}
                </span>
                {[...PRESETS, "custom" as const].map((key) => {
                  const pressed = (showCustom ? "custom" : range.kind) === key;

                  return (
                    <button
                      key={key}
                      aria-pressed={pressed}
                      className={clsx(
                        "flex min-h-12 items-center rounded-control border px-4 text-left text-sm font-semibold transition-colors",
                        pressed
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-surface text-heading hover:bg-default",
                      )}
                      type="button"
                      onClick={() => pickPreset(key)}
                    >
                      {t(RANGE_LABEL[key])}
                    </button>
                  );
                })}
              </div>
              {customDates}
              {timeline.groups.length > 0 && groupSelect}
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full font-semibold"
                onPress={() => setSheetOpen(false)}
              >
                {t("showReports", { count: rows.length })}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
