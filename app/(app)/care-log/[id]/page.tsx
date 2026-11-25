import type { Metadata } from "next";
import type { CareLogEntry } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  CalendarDaysIcon,
  ClockIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLinkButton } from "./_components/copy-link-button";
import { DeleteEntryButton } from "./_components/delete-entry-button";

import { ApiError } from "@/api/api-client";
import { getCareLogEntry } from "@/api/care-log-api/client";
import { getMe } from "@/api/members-api/client";
import {
  AddToCalendar,
  canAddToCalendar,
} from "@/components/care/add-to-calendar";
import { CareKindIcon } from "@/components/care/care-kind-icon";
import { LogCareButton } from "@/components/care/log-care-button";
import { card, title as titleStyles } from "@/components/primitives";
import { SourceLine } from "@/components/report-timeline/timeline-care-row";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";
import { StatusBadge } from "@/components/status-badge";
import { getPermissions } from "@/lib/auth/get-permissions";
import { can } from "@/lib/auth/permissions";
import {
  canRecordNow,
  careTitleKey,
  formatCareWhen,
} from "@/lib/care-log-format";
import { churchDateOf, getChurchToday } from "@/lib/church-time";
import {
  formatCalendarRowDate,
  formatCalendarShortDate,
} from "@/lib/format-date";
import { formatList, formatListParts } from "@/lib/format-list";
import { firstNameOf } from "@/lib/report-items";
import { personHref } from "@/lib/person-href";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");

  return { title: t("careCalendar") };
}

const TITLE_ID = "care-entry-title";

/**
 * A care log entry's own page (care spec rules 56–58): the link leaders send each other and the one
 * the calendar event carries. It shows the entry as the timeline row does, with room. Whoever can't
 * see the entry (outside its audience, deleted, unknown id, no `careLog: view`) gets the same
 * not-found page, with no hint which (rule 57). Signed out, the shell sends them to sign in and
 * back here.
 */
export default async function CareLogEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const permissions = await getPermissions();

  if (!/^\d+$/.test(rawId) || !can(permissions, { careLog: ["view"] })) {
    notFound();
  }

  const [entry, me, t, locale] = await Promise.all([
    getCareLogEntry(Number(rawId)).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();

      throw error;
    }),
    getMe(),
    getTranslations("CareLog"),
    getLocale(),
  ]);
  const typedLocale = locale as Locale;
  const today = getChurchToday();
  const planned = entry.status === "planned";
  const cancelled = entry.status === "cancelled";
  const canWrite = can(permissions, { careLog: ["create"] });
  const title = t(careTitleKey(entry));
  const when = formatCareWhen(entry, typedLocale);
  const dateOnly = formatCalendarRowDate(entry.occurredOn, typedLocale);
  const myMemberId = me.member?.id ?? null;
  const you = (member: { memberId: number; name: string }) =>
    member.memberId === myMemberId
      ? t("entry.you", { name: member.name })
      : member.name;

  const facts: { key: string; label: string; value: string }[] = [
    {
      key: "by",
      label: planned || cancelled ? t("entry.plannedBy") : t("entry.by"),
      value: you(entry.author),
    },
  ];

  if (entry.participants.length > 0) {
    facts.push({
      key: "with",
      label: t("entry.with"),
      value: formatList(entry.participants.map(you), typedLocale),
    });
  }

  if (entry.meetingMode) {
    facts.push({
      key: "where",
      label: t("entry.where"),
      value:
        entry.meetingMode === "online" ? t("modeOnline") : t("modeInPerson"),
    });
  }

  if (entry.kind === "heard" && entry.heardFrom) {
    facts.push({
      key: "heard",
      label: t("entry.heardFrom"),
      value: entry.heardFrom,
    });
  }

  if (entry.others) {
    facts.push({ key: "also", label: t("entry.also"), value: entry.others });
  }

  // A cancelled plan's text is still its purpose (the board: "Purpose" for anything not done).
  const textLabel =
    entry.status !== "done"
      ? t("entry.purpose")
      : entry.kind === "heard"
        ? t("entry.whatTheyTold")
        : entry.kind === "note"
          ? t("entry.note")
          : entry.kind === "message"
            ? t("entry.whatHappened")
            : t("entry.howItWent");
  const visibility = visibilityText(entry);
  const loggedDate = formatCalendarShortDate(
    churchDateOf(entry.createdAt),
    typedLocale,
  );
  const editedDate = entry.editedAt
    ? formatCalendarShortDate(churchDateOf(entry.editedAt), typedLocale)
    : null;
  const recordHere = canWrite && canRecordNow(entry, today);
  const pastDueBanner = recordHere && entry.pastDue;
  const tone = entry.pastDue
    ? "bg-warning-soft text-warning-soft-foreground"
    : planned || cancelled || entry.kind === "heard"
      ? "bg-default text-muted"
      : "bg-accent-soft text-accent-soft-foreground";

  function visibilityText(value: CareLogEntry): string {
    if (value.visibility === "private") {
      return value.participants.length > 0
        ? t("entry.visibleWith", {
            names: formatList(
              value.participants.map((p) => p.name),
              typedLocale,
            ),
          })
        : t("visiblePrivate");
    }

    return value.people.length === 1
      ? t("visibleLeaders", { name: firstNameOf(value.people[0].name) })
      : t("entry.visibleLeadersMany");
  }

  const names = entry.people.map((person) => {
    const id = person.memberId ?? person.guestId;

    return {
      name: person.name,
      href:
        person.viewable && id !== null
          ? personHref({
              type: person.memberId !== null ? "member" : "guest",
              id,
            })
          : null,
    };
  });

  const labelClass =
    "pt-[3px] text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted";

  return (
    <div className="flex max-w-[900px] flex-col gap-5">
      <StaffAppBreadcrumbs
        items={[
          { labelKey: "careCalendar", href: "/care/calendar" },
          { label: title, href: `/care-log/${entry.id}` },
        ]}
      />

      <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
        <span
          aria-hidden="true"
          className={clsx(
            "flex size-[52px] shrink-0 items-center justify-center rounded-[14px]",
            tone,
          )}
        >
          <CareKindIcon className="size-[26px]" kind={entry.kind} />
        </span>
        <div className="flex min-w-[min(360px,100%)] flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1
              className={titleStyles({
                size: "md",
                className: "outline-none",
              })}
              id={TITLE_ID}
            >
              {title}
            </h1>
            {(planned || cancelled) && (
              <StatusBadge
                tone={entry.pastDue ? "warning" : "neutral"}
                variant={entry.pastDue ? "solid-dot" : "ring-dot"}
              >
                {cancelled
                  ? t("entry.badgeCancelled")
                  : entry.pastDue
                    ? t("badgePastDue")
                    : t("badgePlanned")}
              </StatusBadge>
            )}
          </div>
          <p className="inline-flex items-center gap-[7px] text-base font-semibold text-heading">
            <CalendarDaysIcon
              aria-hidden="true"
              className="size-[17px] text-muted"
              strokeWidth={1.8}
            />
            {when}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2.5 md:w-auto">
          <CopyLinkButton className="max-md:flex-1" entryId={entry.id} />
          {canAddToCalendar(entry) && (
            <AddToCalendar
              className="h-11! max-md:flex-1"
              entry={entry}
              placement="bottom end"
            />
          )}
          {recordHere && !pastDueBanner && (
            <LogCareButton
              ariaLabel={t("recordAria", { title, date: dateOnly })}
              className="h-11 px-4 text-[14.5px] max-md:flex-1"
              label={t("record")}
              returnFocusId={TITLE_ID}
              target={{ type: "complete", entry }}
              today={today}
              variant="record"
            />
          )}
        </div>
      </div>

      {pastDueBanner && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-xl bg-warning-soft px-[18px] py-3.5 text-warning-soft-foreground"
          role="status"
        >
          <ClockIcon
            aria-hidden="true"
            className="size-5 shrink-0"
            strokeWidth={1.8}
          />
          <span className="min-w-[min(260px,100%)] flex-1 text-[15px] font-semibold">
            {t("entry.pastDue", { date: dateOnly })}
          </span>
          <LogCareButton
            ariaLabel={t("recordAria", { title, date: dateOnly })}
            className="h-11 px-4 text-[14.5px] max-md:w-full"
            label={t("record")}
            returnFocusId={TITLE_ID}
            target={{ type: "complete", entry }}
            today={today}
            variant="primary"
          />
        </div>
      )}

      <section className={card({ className: "flex flex-col" })}>
        <div className="flex flex-col gap-4 px-4 py-[18px] md:px-6 md:py-[22px]">
          <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-[15px] md:grid-cols-[140px_1fr]">
            <dt className={labelClass}>{t("about")}</dt>
            <dd className="flex flex-wrap gap-x-3 gap-y-1">
              {formatListParts(
                names.map((person) => person.name),
                typedLocale,
              ).map((part, position) => {
                if (part.type === "literal") {
                  return (
                    <span key={position} className="text-foreground">
                      {part.value.trim() ? part.value : null}
                    </span>
                  );
                }

                const href = names[part.index].href;

                return href ? (
                  <NextLink
                    key={position}
                    className="font-semibold text-link underline decoration-gold-500 underline-offset-[3px]"
                    href={href}
                  >
                    {part.value}
                  </NextLink>
                ) : (
                  <span key={position} className="font-semibold text-heading">
                    {part.value}
                  </span>
                );
              })}
            </dd>
            {facts.map((fact) => (
              <Fragment key={fact.key}>
                <dt className={labelClass}>{fact.label}</dt>
                <dd className="text-foreground">{fact.value}</dd>
              </Fragment>
            ))}
          </dl>
          {entry.text && (
            <div className="flex flex-col gap-1.5 border-t border-separator pt-3.5">
              <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                {textLabel}
              </h2>
              <p className="max-w-[68ch] whitespace-pre-line text-pretty break-words text-base leading-[1.6] text-foreground">
                {entry.text}
              </p>
            </div>
          )}
          {cancelled && entry.cancelReason && (
            <div className="flex flex-col gap-1.5 border-t border-separator pt-3.5">
              <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                {t("entry.reason")}
              </h2>
              <p className="whitespace-pre-line break-words text-base leading-[1.6] text-foreground">
                {entry.cancelReason}
              </p>
            </div>
          )}
          <p className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5 border-t border-separator pt-3.5 text-[13px] text-subtle">
            <span className="inline-flex items-center gap-[5px] font-medium">
              <LockClosedIcon
                aria-hidden="true"
                className="size-[13px] shrink-0"
                strokeWidth={1.8}
              />
              {visibility}
            </span>
            {entry.source && <SourceLine source={entry.source} />}
            <span>{t("entry.logged", { date: loggedDate })}</span>
            {editedDate && (
              <span>{t("entry.edited", { date: editedDate })}</span>
            )}
          </p>
        </div>
        {entry.canEdit && (
          <OwnerBar entry={entry} title={title} today={today} when={dateOnly} />
        )}
      </section>
    </div>
  );
}

/** *Edit* and *Delete*: the author's own entry only (rule 10). */
async function OwnerBar({
  entry,
  title,
  when,
  today,
}: {
  entry: CareLogEntry;
  title: string;
  when: string;
  today: string;
}) {
  const t = await getTranslations("CareLog");

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-b-card border-t border-border bg-surface-secondary px-4 py-3 md:px-6">
      {entry.status !== "cancelled" && (
        <LogCareButton
          ariaLabel={t("editAria", { title, date: when })}
          className="min-h-11! text-[14.5px]!"
          label={t("edit")}
          returnFocusId={TITLE_ID}
          target={{ type: "edit", entry }}
          today={today}
          variant="link"
        />
      )}
      <DeleteEntryButton
        ariaLabel={t("entry.deleteAria", { title, date: when })}
        entryId={entry.id}
      />
    </div>
  );
}
