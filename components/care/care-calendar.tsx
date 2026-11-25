"use client";

import type { CareLogEntry } from "@/api/care-log-api/types";
import type { LogCareTarget } from "./log-care-button";
import type { CalendarQuery } from "@/lib/care-calendar";
import type { Locale } from "@/lib/locale-shared";

import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CareCalendarPanel } from "./care-calendar-panel";
import { CareKindIcon } from "./care-kind-icon";
import { LogCareDialog } from "./log-care-button";
import { useEntryMeta } from "./use-entry-meta";

import { CareIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { shortPersonName } from "@/lib/care-calendar-event";
import {
  calendarHref,
  CALENDAR_KINDS,
  monthGrid,
  shiftMonth,
  weekStartOf,
} from "@/lib/care-calendar";
import {
  careTitleKey,
  formatCareTime,
  formatShortCareTime,
} from "@/lib/care-log-format";
import {
  formatCalendarDayHeading,
  formatCalendarMonth,
  formatCalendarMonthName,
  formatCalendarShortWeekday,
  formatCalendarWeekdayDate,
} from "@/lib/format-date";
import { formatListParts } from "@/lib/format-list";
import { personHref } from "@/lib/person-href";
import { useMediaQuery } from "@/lib/use-media-query";

/** At most this many entries in a month cell; the rest is "+N more", which opens the agenda. */
const CELL_MAX = 2;

type Look = "done" | "planned" | "pastDue";

function lookOf(entry: CareLogEntry): Look {
  return entry.pastDue
    ? "pastDue"
    : entry.status === "planned"
      ? "planned"
      : "done";
}

/** Done is soft blue, planned a dashed outline, past due amber (rule 54). */
const CHIP_LOOK: Record<Look, string> = {
  done: "border-solid border-accent-soft bg-accent-soft text-accent-soft-foreground",
  planned: "border-dashed border-field-border bg-surface text-heading",
  pastDue:
    "border-solid border-warning-soft-foreground/35 bg-warning-soft text-warning-soft-foreground",
};

function tileLook(entry: CareLogEntry): string {
  if (entry.pastDue) return "bg-warning-soft text-warning-soft-foreground";

  if (entry.status === "planned" || entry.kind === "heard") {
    return "bg-default text-muted";
  }

  return "bg-accent-soft text-accent-soft-foreground";
}

/**
 * The care calendar (care spec rules 50–55): a month grid and an agenda of the entries the page
 * fetched for the month, the toolbar and filters (all in the URL), and the entry panel. A
 * navigation is a new request: the page reads the month again.
 */
export function CareCalendar({
  query,
  entries,
  today,
  groups,
  isElder,
  viewerMemberId,
  canWrite,
}: {
  query: CalendarQuery;
  entries: CareLogEntry[];
  /** The church's today, "YYYY-MM-DD". */
  today: string;
  /** The group picker's options; `null` hides the picker. */
  groups: { id: number; name: string }[] | null;
  /** `careLog: all`: the whole church under *All*. */
  isElder: boolean;
  viewerMemberId: number | null;
  /** `careLog: create`. */
  canWrite: boolean;
}) {
  const t = useTranslations("CareCalendar");
  const log = useTranslations("CareLog");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [pending, startTransition] = useTransition();
  const [panelId, setPanelId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    target: LogCareTarget;
    date?: string;
  } | null>(null);
  const entryMeta = useEntryMeta(viewerMemberId);
  const monthStart = `${query.month}-01`;
  const view = query.view ?? (isDesktop ? "month" : "agenda");
  // With no `view` in the URL the default is by width; CSS shows the right one before the width is known.
  const monthClass =
    query.view === "month"
      ? ""
      : query.view === "agenda"
        ? "hidden"
        : "hidden md:block";
  const agendaClass =
    query.view === "agenda"
      ? ""
      : query.view === "month"
        ? "hidden"
        : "md:hidden";
  const panelEntry = entries.find((entry) => entry.id === panelId) ?? null;
  const weeks = monthGrid(query.month, weekStartOf(locale));
  const byDay = new Map<string, CareLogEntry[]>();

  for (const entry of entries) {
    byDay.set(entry.occurredOn, [
      ...(byDay.get(entry.occurredOn) ?? []),
      entry,
    ]);
  }

  function go(changes: Partial<CalendarQuery>) {
    startTransition(() =>
      router.push(calendarHref(query, today, changes), { scroll: false }),
    );
  }

  const hint =
    query.filter === "mine"
      ? t("hintMine")
      : !isElder
        ? t("hintAllLeader")
        : query.groupId !== null
          ? t("hintAllGroup", {
              group: groups?.find((g) => g.id === query.groupId)?.name ?? "",
            })
          : t("hintAllElder");
  const segment = (on: boolean) =>
    clsx(
      "inline-flex h-9 flex-1 items-center justify-center gap-[7px] rounded-lg px-3.5 text-sm font-semibold",
      on ? "bg-segment-selected text-heading shadow-segment" : "text-muted",
    );

  function names(entry: CareLogEntry) {
    return (
      shortPersonName(entry.people[0]?.name ?? "") +
      (entry.people.length > 1 ? ` +${entry.people.length - 1}` : "")
    );
  }

  function chipAria(entry: CareLogEntry) {
    return t("chipAria", {
      title: log(careTitleKey(entry)),
      time: entry.occurredAtTime
        ? formatCareTime(entry.occurredAtTime, locale)
        : "none",
      names: entry.people.map((p) => p.name).join(", "),
      pastDue: entry.pastDue ? "yes" : "no",
    });
  }

  const inMonth = entries.length;
  const emptyMonth = formatCalendarMonthName(monthStart, locale);

  return (
    <div className={clsx("flex flex-col gap-5", pending && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-1 items-center gap-2 max-md:basis-full">
          <Button
            className="h-10 px-3.5 text-sm font-semibold"
            variant="outline"
            onPress={() => go({ month: today.slice(0, 7) })}
          >
            {t("today")}
          </Button>
          <Button
            aria-label={t("prev")}
            className="size-10 min-w-0 p-0"
            variant="outline"
            onPress={() => go({ month: shiftMonth(query.month, -1) })}
          >
            <ChevronLeftIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </Button>
          <Button
            aria-label={t("next")}
            className="size-10 min-w-0 p-0"
            variant="outline"
            onPress={() => go({ month: shiftMonth(query.month, 1) })}
          >
            <ChevronRightIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </Button>
          <h2
            aria-live="polite"
            className="ml-1.5 flex-1 font-display text-[22px] font-medium text-heading md:text-2xl"
          >
            {formatCalendarMonth(monthStart, locale)}
          </h2>
        </div>
        <div
          aria-label={t("viewLabel")}
          className="inline-flex gap-[3px] rounded-[10px] border border-border bg-segment p-[3px] max-md:w-full"
          role="group"
        >
          <button
            aria-pressed={view === "month"}
            className={segment(view === "month")}
            type="button"
            onClick={() => go({ view: "month" })}
          >
            <CalendarDaysIcon
              aria-hidden="true"
              className="size-[15px]"
              strokeWidth={1.8}
            />
            {t("viewMonth")}
          </button>
          <button
            aria-pressed={view === "agenda"}
            className={segment(view === "agenda")}
            type="button"
            onClick={() => go({ view: "agenda" })}
          >
            <ListBulletIcon
              aria-hidden="true"
              className="size-[15px]"
              strokeWidth={1.8}
            />
            {t("viewAgenda")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        <div
          aria-label={t("whose")}
          className="inline-flex gap-[3px] rounded-[10px] border border-border bg-surface p-[3px]"
          role="group"
        >
          {(["mine", "all"] as const).map((key) => (
            <button
              key={key}
              aria-pressed={query.filter === key}
              className={clsx(
                "h-9 rounded-lg px-4 text-sm font-semibold",
                query.filter === key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted",
              )}
              type="button"
              onClick={() => go({ filter: key, groupId: null })}
            >
              {t(key)}
            </button>
          ))}
        </div>
        {query.filter === "all" && groups && (
          <label className="inline-flex items-center gap-2.5 text-[13.5px] font-semibold text-muted max-md:w-full">
            <span>{t("group")}</span>
            <span className="relative inline-flex flex-1">
              <select
                className={clsx(
                  "h-[42px] w-full min-w-[210px] appearance-none rounded-[10px] border bg-surface pl-3 pr-9 text-sm font-medium text-heading",
                  query.groupId === null
                    ? "border-field-border"
                    : "border-accent",
                )}
                value={query.groupId ?? ""}
                onChange={(event) =>
                  go({
                    groupId: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
              >
                <option value="">
                  {isElder ? t("groupAllElder") : t("groupAllLeader")}
                </option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted"
                strokeWidth={2}
              />
            </span>
          </label>
        )}
        <div
          aria-label={t("kinds")}
          className="flex flex-wrap gap-1.5"
          role="group"
        >
          {CALENDAR_KINDS.map((kind) => {
            const on = query.kinds.includes(kind);

            return (
              <button
                key={kind}
                aria-pressed={on}
                className={clsx(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13.5px] font-semibold",
                  on
                    ? "border-accent-soft-foreground bg-accent-soft text-accent-soft-foreground"
                    : "border-border bg-surface text-foreground",
                )}
                type="button"
                onClick={() =>
                  go({
                    kinds: on
                      ? query.kinds.filter((k) => k !== kind)
                      : [...query.kinds, kind],
                  })
                }
              >
                <CareKindIcon
                  className="size-3.5"
                  kind={kind}
                  strokeWidth={1.8}
                />
                {log(`kinds.${kind}`)}
              </button>
            );
          })}
        </div>
      </div>
      <p className="-mt-1.5 max-w-[760px] text-[13.5px] leading-normal text-muted">
        {hint}
      </p>

      {inMonth === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-12 text-center shadow-[0_1px_2px_rgb(11_35_65/0.05)] dark:shadow-none">
          <span className="flex size-[52px] items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
            <CareIcon className="size-[26px]" />
          </span>
          <h2 className="font-display text-[22px] font-medium text-heading">
            {t("emptyTitle", { month: emptyMonth })}
          </h2>
          <p className="max-w-[460px] text-[14.5px] leading-[1.55] text-muted">
            {query.filter === "mine" ? t("emptyMine") : t("emptyAll")}
          </p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
            {query.filter === "mine" && (
              <Button
                className="h-11 px-4 text-[14.5px] font-semibold"
                variant="outline"
                onPress={() => go({ filter: "all", groupId: null })}
              >
                {t("seeAll")}
              </Button>
            )}
            {canWrite && (
              <Button
                className="h-11 px-4 text-[14.5px] font-semibold"
                variant="primary"
                onPress={() => setForm({ target: { type: "new" } })}
              >
                {log("log")}
              </Button>
            )}
          </div>
        </section>
      ) : (
        <>
          <section
            aria-label={formatCalendarMonth(monthStart, locale)}
            className={clsx(
              "overflow-hidden rounded-card border border-border bg-surface shadow-[0_1px_2px_rgb(11_35_65/0.05)] dark:shadow-none",
              monthClass,
            )}
          >
            <div
              className="grid grid-cols-7 border-b border-border bg-surface-secondary"
              role="row"
            >
              {weeks[0].map((day) => (
                <span
                  key={day.date}
                  className="px-1.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-muted md:px-3 md:text-[12.5px]"
                  role="columnheader"
                >
                  {formatCalendarShortWeekday(day.date, locale)}
                </span>
              ))}
            </div>
            {weeks.map((week) => (
              <div
                key={week[0].date}
                className="grid grid-cols-7 border-b border-separator"
                role="row"
              >
                {week.map((day, column) => {
                  const list = day.inMonth ? (byDay.get(day.date) ?? []) : [];
                  const isToday = day.date === today;
                  const number = Number(day.date.slice(8));

                  return (
                    <div
                      key={day.date}
                      aria-label={
                        day.inMonth
                          ? `${formatCalendarWeekdayDate(day.date, locale)}${
                              list.length
                                ? `, ${t("dayEntries", { count: list.length })}`
                                : ""
                            }`
                          : undefined
                      }
                      className={clsx(
                        "group flex min-h-[88px] min-w-0 flex-col gap-1 p-1 pb-2 md:min-h-32 md:gap-[5px] md:p-2",
                        column > 0 && "border-l border-separator",
                        !day.inMonth
                          ? "bg-surface-secondary"
                          : isToday
                            ? "bg-gold-500/5"
                            : "bg-surface",
                      )}
                      role="gridcell"
                    >
                      <span className="flex items-center justify-between">
                        <span
                          className={clsx(
                            "inline-flex size-7 items-center justify-center rounded-full text-[13.5px] tabular-nums",
                            isToday
                              ? "bg-gold-500 font-bold text-navy-900"
                              : day.inMonth
                                ? "font-semibold text-heading"
                                : "font-semibold text-subtle",
                          )}
                        >
                          {number}
                        </span>
                        {day.inMonth && canWrite && (
                          <button
                            aria-label={t("logOn", {
                              date: formatCalendarWeekdayDate(day.date, locale),
                            })}
                            className={clsx(
                              "flex size-7 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-secondary focus-visible:opacity-100 max-md:hidden",
                              !isToday &&
                                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                            )}
                            type="button"
                            onClick={() =>
                              setForm({
                                target: { type: "new" },
                                date: day.date,
                              })
                            }
                          >
                            <PlusIcon
                              aria-hidden="true"
                              className="size-3.5"
                              strokeWidth={2}
                            />
                          </button>
                        )}
                      </span>
                      {list.slice(0, CELL_MAX).map((entry) => (
                        <button
                          key={entry.id}
                          aria-label={chipAria(entry)}
                          className={clsx(
                            "flex min-h-[26px] w-full items-center gap-[5px] overflow-hidden rounded-[7px] border px-1 py-[3px] text-left text-[11.5px] font-semibold md:px-[7px] md:text-[12.5px]",
                            CHIP_LOOK[lookOf(entry)],
                          )}
                          type="button"
                          onClick={() => setPanelId(entry.id)}
                        >
                          <CareKindIcon
                            className="size-3 shrink-0"
                            kind={entry.kind}
                            strokeWidth={1.9}
                          />
                          {entry.occurredAtTime && (
                            <span className="shrink-0 font-medium tabular-nums opacity-85 max-md:hidden">
                              {formatShortCareTime(
                                entry.occurredAtTime,
                                locale,
                              )}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {names(entry)}
                          </span>
                        </button>
                      ))}
                      {list.length > CELL_MAX && (
                        <button
                          className="self-start px-1 py-0.5 text-[12.5px] font-semibold text-link underline decoration-gold-500 underline-offset-[3px]"
                          type="button"
                          onClick={() => go({ view: "agenda" })}
                        >
                          {t("more", { count: String(list.length - CELL_MAX) })}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <ul className="flex flex-wrap items-center gap-x-[18px] gap-y-2 px-4 py-3 text-[12.5px] text-muted">
              {(
                [
                  ["done", t("legendDone")],
                  ["planned", t("legendPlanned")],
                  ["pastDue", t("legendPastDue")],
                ] as const
              ).map(([look, label]) => (
                <li key={look} className="inline-flex items-center gap-[7px]">
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "h-3 w-[18px] rounded border",
                      CHIP_LOOK[look],
                    )}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-label={formatCalendarMonth(monthStart, locale)}
            className={clsx(
              "overflow-hidden rounded-card border border-border bg-surface shadow-[0_1px_2px_rgb(11_35_65/0.05)] dark:shadow-none",
              agendaClass,
            )}
          >
            {[...byDay.keys()].sort().map((date, index) => (
              <div
                key={date}
                className={clsx(index > 0 && "border-t border-border")}
              >
                <h3
                  className={clsx(
                    "flex items-center gap-2.5 px-3.5 pb-2 pt-3 text-sm font-bold text-heading md:px-5",
                    date === today ? "bg-gold-500/5" : "bg-surface-secondary",
                  )}
                >
                  {formatCalendarDayHeading(date, locale)}
                  {date === today && (
                    <span className="rounded-full bg-gold-500 px-[9px] py-px text-xs font-bold text-navy-900">
                      {t("todayTag")}
                    </span>
                  )}
                </h3>
                <ul>
                  {(byDay.get(date) ?? []).map((entry) => {
                    const people = entry.people.map((person) => {
                      const id = person.memberId ?? person.guestId;

                      return {
                        name: person.name,
                        href:
                          person.viewable && id !== null
                            ? personHref({
                                type:
                                  person.memberId !== null ? "member" : "guest",
                                id,
                              })
                            : null,
                      };
                    });
                    const title = log(careTitleKey(entry));

                    return (
                      <li
                        key={entry.id}
                        className="flex items-start gap-3.5 px-3.5 pb-3.5 pt-2.5 md:px-5"
                      >
                        <span className="w-[62px] shrink-0 pt-1.5 text-[13.5px] font-semibold tabular-nums text-muted md:w-[92px]">
                          {entry.occurredAtTime
                            ? formatCareTime(entry.occurredAtTime, locale)
                            : null}
                        </span>
                        <span
                          aria-hidden="true"
                          className={clsx(
                            "flex size-[30px] shrink-0 items-center justify-center rounded-[9px]",
                            tileLook(entry),
                          )}
                        >
                          <CareKindIcon className="size-4" kind={entry.kind} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <button
                              aria-label={t("openAria", {
                                title,
                                names: entry.people
                                  .map((p) => p.name)
                                  .join(", "),
                              })}
                              className="text-left text-[15px] font-semibold text-heading underline decoration-border underline-offset-4"
                              type="button"
                              onClick={() => setPanelId(entry.id)}
                            >
                              {title}
                            </button>
                            {entry.status === "planned" && (
                              <StatusBadge
                                tone={entry.pastDue ? "warning" : "neutral"}
                                variant={
                                  entry.pastDue ? "solid-dot" : "ring-dot"
                                }
                              >
                                {entry.pastDue
                                  ? log("badgePastDue")
                                  : log("badgePlanned")}
                              </StatusBadge>
                            )}
                            {entry.visibility === "private" && (
                              <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-subtle">
                                <LockClosedIcon
                                  aria-hidden="true"
                                  className="size-3"
                                  strokeWidth={1.8}
                                />
                                {log("visiblePrivate")}
                              </span>
                            )}
                          </span>
                          <span className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[14.5px]">
                            {formatListParts(
                              people.map((p) => p.name),
                              locale,
                            ).map((part, position) => {
                              if (part.type === "literal") {
                                return (
                                  <Fragment key={position}>
                                    {part.value.trim() ? part.value : null}
                                  </Fragment>
                                );
                              }

                              const href = people[part.index].href;

                              return href ? (
                                <NextLink
                                  key={position}
                                  className="font-semibold text-link underline decoration-gold-500 underline-offset-[3px]"
                                  href={href}
                                >
                                  {part.value}
                                </NextLink>
                              ) : (
                                <span
                                  key={position}
                                  className="font-semibold text-foreground"
                                >
                                  {part.value}
                                </span>
                              );
                            })}
                          </span>
                          <span className="text-[13px] text-muted">
                            {entryMeta(entry)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}

      <CareCalendarPanel
        canWrite={canWrite}
        entry={panelEntry}
        today={today}
        viewerMemberId={viewerMemberId}
        onClose={() => setPanelId(null)}
        onEdit={(entry) => {
          setPanelId(null);
          setForm({ target: { type: "edit", entry } });
        }}
        onRecord={(entry) => {
          setPanelId(null);
          setForm({ target: { type: "complete", entry } });
        }}
      />
      <LogCareDialog
        date={form?.date}
        open={form !== null}
        target={form?.target}
        today={today}
        onOpenChange={(open) => !open && setForm(null)}
      />
    </div>
  );
}
