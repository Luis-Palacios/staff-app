import type { CareLogEntry } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { Fragment } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { getCareLogComingUp } from "@/api/care-log-api/client";
import { AddToCalendar } from "@/components/care/add-to-calendar";
import { CareKindIcon } from "@/components/care/care-kind-icon";
import { LogCareButton } from "@/components/care/log-care-button";
import { card, title } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { can } from "@/lib/auth/permissions";
import { getPermissions } from "@/lib/auth/get-permissions";
import {
  canRecordNow,
  formatCareTime,
  isPlannableKind,
} from "@/lib/care-log-format";
import { getChurchToday } from "@/lib/church-time";
import { formatCalendarRowDate } from "@/lib/format-date";
import { formatList, formatListParts } from "@/lib/format-list";
import { personHref } from "@/lib/person-href";
import { settle } from "@/lib/settle";

/**
 * "Coming up" (care spec rule 11) under *Waiting for your reply* on the leader dashboard and the
 * elder Report status page: the viewer's own plans (as author or as someone who took part), first
 * the ones whose date passed and wait for *Record how it went*, then the next 7 days. No "see all"
 * link: only your own plans are listed, so it stays short. Hidden when both lists are empty, when
 * the caller can't read the care log, and when the read fails (the rest of the page doesn't
 * depend on it).
 */
export async function ComingUpCard() {
  const permissions = await getPermissions();

  if (!can(permissions, { careLog: ["view"] })) return null;

  const [t, locale, result] = await Promise.all([
    getTranslations("CareLog"),
    getLocale(),
    settle(getCareLogComingUp()),
  ]);

  if (!result.ok) return null;

  const { pastDue, upcoming } = result.value;
  const count = pastDue.length + upcoming.length;

  if (count === 0) return null;

  const today = getChurchToday();
  const typedLocale = locale as Locale;
  // *Record how it went* writes, so it needs `careLog: create` on top of `canComplete`.
  const canCreate = can(permissions, { careLog: ["create"] });

  function row(entry: CareLogEntry, overdue: boolean) {
    const what = overdue
      ? isPlannableKind(entry.kind)
        ? t(`titlesPlanned.${entry.kind}`)
        : t(`titles.${entry.kind}`)
      : entry.kind === "meeting" && entry.meetingMode
        ? t(
            entry.meetingMode === "online"
              ? "dashMeetingOnline"
              : "dashMeetingInPerson",
          )
        : t(`kinds.${entry.kind}`);
    const date = formatCalendarRowDate(entry.occurredOn, typedLocale);
    const meta = [
      date,
      entry.occurredAtTime
        ? formatCareTime(entry.occurredAtTime, typedLocale)
        : null,
      entry.participants.length > 0
        ? t("metaWith", {
            names: formatList(
              entry.participants.map((p) => p.name),
              typedLocale,
            ),
          })
        : null,
      entry.text,
    ]
      .filter(Boolean)
      .join(" · ");
    const names = entry.people.map((person) => ({
      name: person.name,
      href:
        person.viewable && (person.memberId ?? person.guestId) !== null
          ? personHref({
              type: person.memberId !== null ? "member" : "guest",
              id: (person.memberId ?? person.guestId) as number,
            })
          : null,
    }));

    return (
      <li
        key={entry.id}
        className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-[18px] py-3.5 sm:px-[22px]"
      >
        <span
          aria-hidden="true"
          className={
            overdue
              ? "flex size-9 shrink-0 items-center justify-center rounded-tile bg-warning-soft text-warning-soft-foreground"
              : "flex size-9 shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground"
          }
        >
          <CareKindIcon className="size-[17px]" kind={entry.kind} />
        </span>
        <span className="flex min-w-[min(260px,100%)] flex-1 flex-col gap-[3px]">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="text-[15px] font-semibold text-heading">
              {formatListParts(
                names.map((person) => person.name),
                typedLocale,
              ).map((part, position) => {
                const href =
                  part.type === "element" ? names[part.index].href : null;

                return href ? (
                  <NextLink
                    key={position}
                    className="underline decoration-border underline-offset-[3px] hover:decoration-current"
                    href={href}
                  >
                    {part.value}
                  </NextLink>
                ) : (
                  <Fragment key={position}>{part.value}</Fragment>
                );
              })}
            </span>
            {/* Rule 58: the kind opens the entry's own page. */}
            <NextLink
              aria-label={t("entry.openAria", { title: what, date })}
              className="text-[13.5px] text-foreground underline decoration-border underline-offset-[3px] hover:decoration-current"
              href={`/care-log/${entry.id}`}
              prefetch={false}
            >
              {what}
            </NextLink>
            {overdue && (
              <StatusBadge tone="warning">{t("dashPastDue")}</StatusBadge>
            )}
          </span>
          <span className="line-clamp-2 text-[13.5px] text-muted">{meta}</span>
        </span>
        {canRecordNow(entry, today) && canCreate && (
          <LogCareButton
            ariaLabel={t("recordAria", {
              title: what,
              date: `${formatList(
                names.map((n) => n.name),
                typedLocale,
              )}, ${date}`,
            })}
            className="h-10 px-3.5 text-sm"
            label={t("record")}
            returnFocusId="coming-up"
            target={{ type: "complete", entry }}
            today={today}
            variant="record"
          />
        )}
        {/* Rule 47: a 44 px icon button on a *Coming up* row. */}
        <AddToCalendar
          ariaLabel={t("calendar.addAria", {
            title: what,
            names: formatList(
              names.map((n) => n.name),
              typedLocale,
            ),
          })}
          entry={entry}
          placement="bottom end"
          variant="icon"
        />
      </li>
    );
  }

  return (
    <section
      aria-labelledby="coming-up"
      className={card({ className: "mb-7 flex flex-col overflow-hidden" })}
    >
      <header className="flex flex-col gap-0.5 px-[18px] pb-3.5 pt-5 sm:px-[22px]">
        <h2
          className={title({
            size: "sm",
            className: "flex items-center gap-2.5 text-[22px]",
          })}
          id="coming-up"
        >
          {t("comingUp")}
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-default px-[7px] font-sans text-[12.5px] font-bold tabular-nums text-muted">
            {count}
          </span>
        </h2>
        <p className="text-[13.5px] text-muted">{t("dashSub")}</p>
      </header>
      <ul className="divide-y divide-separator border-t border-separator">
        {pastDue.map((entry) => row(entry, true))}
        {upcoming.map((entry) => row(entry, false))}
      </ul>
    </section>
  );
}
