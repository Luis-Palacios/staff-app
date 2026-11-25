import type { CareLogEntry, CareLogSourceRef } from "@/api/care-log-api/types";
import type { PersonTimeline } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CareKindIcon } from "@/components/care/care-kind-icon";
import { LogCareButton } from "@/components/care/log-care-button";
import { StatusBadge } from "@/components/status-badge";
import {
  canRecordNow,
  formatCareTime,
  isPlannableKind,
} from "@/lib/care-log-format";
import {
  formatCalendarRowDate,
  formatCalendarShortWeekdayDate,
} from "@/lib/format-date";
import { formatList, formatListParts } from "@/lib/format-list";
import { personHref } from "@/lib/person-href";
import { firstNameOf } from "@/lib/report-items";

/** Where the entry came from, as a link only when the viewer can open it (rule 12). */
export function SourceLine({ source }: { source: CareLogSourceRef }) {
  const t = useTranslations("CareLog");
  const locale = useLocale() as Locale;

  if (source.gone) {
    return <span className="text-[13px]">{t("sourceGone")}</span>;
  }

  if (!source.visible) {
    return <span className="text-[13px]">{t("sourceHidden")}</span>;
  }

  if (source.reportId === null || !source.meetingDate || !source.smallGroup) {
    return null;
  }

  const values = {
    date: formatCalendarShortWeekdayDate(source.meetingDate, locale),
    group: source.smallGroup.name,
  };
  const href =
    source.kind === "section" && source.section
      ? `/groups/reports/${source.reportId}?section=${source.section}`
      : `/groups/reports/${source.reportId}`;

  return (
    <NextLink
      className="text-[13px] text-foreground underline decoration-border underline-offset-[3px] hover:decoration-current"
      href={href}
    >
      {source.kind === "conversation"
        ? t("sourceConversation", values)
        : t("sourceReport", values)}
    </NextLink>
  );
}

/**
 * A care log entry in a person's timeline (care spec rule 13): no group, so the date column says
 * the time or *Care log*. A plan shows *Planned* (amber and *Record how it went* once its date has
 * passed). *Record how it went* and *Edit* appear when the API says the viewer may (`canComplete`
 * and `canEdit`) and the row isn't the Recent activity preview (`today` is left out there).
 */
export function TimelineCareRow({
  entry,
  person,
  compact = false,
  today,
}: {
  entry: CareLogEntry;
  /** Whose timeline this is: left out of "also about", and the *Elders and … leaders* name. */
  person: PersonTimeline["person"];
  compact?: boolean;
  /** The church's today: set on the full timeline, which has the buttons. */
  today?: string;
}) {
  const t = useTranslations("CareLog");
  const locale = useLocale() as Locale;
  const planned = entry.status === "planned";
  const title =
    planned && isPlannableKind(entry.kind)
      ? t(`titlesPlanned.${entry.kind}`)
      : t(`titles.${entry.kind}`);
  const date = formatCalendarRowDate(entry.occurredOn, locale);
  const bits: string[] = [];

  if (entry.kind === "heard") {
    if (entry.heardFrom) bits.push(entry.heardFrom);

    bits.push(t("metaLoggedBy", { name: entry.author.name }));
  } else {
    const name = entry.author.name;

    if (entry.participants.length > 0) {
      const names = formatList(
        entry.participants.map((p) => p.name),
        locale,
      );

      bits.push(
        planned
          ? t("metaPlannedByWith", { name, names })
          : t("metaByWith", { name, names }),
      );
    } else {
      bits.push(planned ? t("metaPlannedBy", { name }) : t("metaBy", { name }));
    }
  }

  if (entry.meetingMode) {
    bits.push(
      entry.meetingMode === "online" ? t("modeOnline") : t("modeInPerson"),
    );
  }

  if (entry.others) bits.push(t("metaAlso", { names: entry.others }));

  const others = entry.people.filter(
    (p) => (person.type === "member" ? p.memberId : p.guestId) !== person.id,
  );
  const tone = planned ? "planned" : entry.kind === "heard" ? "heard" : "done";
  const showActions = !compact && today !== undefined;

  return (
    <li
      className={clsx(
        "flex flex-col gap-3 border-b border-separator px-4 py-[18px] last:border-b-0 md:flex-row md:flex-wrap md:gap-x-6 md:px-6",
      )}
    >
      <div
        className={clsx(
          "flex shrink-0 flex-col gap-1",
          compact ? "md:w-[172px]" : "md:w-[190px]",
        )}
      >
        <p className="text-[15px] font-semibold tabular-nums text-heading">
          {date}
        </p>
        <p className="text-[13px] text-muted">
          {entry.occurredAtTime
            ? formatCareTime(entry.occurredAtTime, locale)
            : t("sideLabel")}
        </p>
      </div>
      <div className="flex min-w-[min(260px,100%)] flex-1 gap-3">
        <span
          aria-hidden="true"
          className={clsx(
            "flex size-[30px] shrink-0 items-center justify-center rounded-[9px]",
            tone === "planned" &&
              "bg-warning-soft text-warning-soft-foreground",
            tone === "heard" && "bg-default text-muted",
            tone === "done" && "bg-accent-soft text-accent-soft-foreground",
          )}
        >
          <CareKindIcon className="size-4" kind={entry.kind} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {/* Rule 13: the title opens the entry's own page (rule 56). */}
            <NextLink
              aria-label={t("entry.openAria", { title, date })}
              className="text-[15px] font-semibold text-heading underline decoration-border underline-offset-4 hover:decoration-current"
              href={`/care-log/${entry.id}`}
              prefetch={false}
            >
              {title}
            </NextLink>
            {planned && (
              <StatusBadge
                tone={entry.pastDue ? "warning" : "neutral"}
                variant={entry.pastDue ? "solid-dot" : "ring-dot"}
              >
                {entry.pastDue ? t("badgePastDue") : t("badgePlanned")}
              </StatusBadge>
            )}
          </span>
          <span className="text-[13px] text-muted">{bits.join(" · ")}</span>
          {others.length > 0 && (
            <span className="text-[13px] text-muted">
              {t("alsoAbout")}{" "}
              {formatListParts(
                others.map((other) => other.name),
                locale,
              ).map((part, position) => {
                if (part.type === "literal") {
                  return <Fragment key={position}>{part.value}</Fragment>;
                }

                const other = others[part.index];
                const id = other.memberId ?? other.guestId;
                const link =
                  other.viewable && id !== null
                    ? personHref({
                        type: other.memberId !== null ? "member" : "guest",
                        id,
                      })
                    : null;

                return link ? (
                  <NextLink
                    key={position}
                    className="text-foreground underline decoration-border underline-offset-[3px]"
                    href={link}
                  >
                    {part.value}
                  </NextLink>
                ) : (
                  <Fragment key={position}>{part.value}</Fragment>
                );
              })}
            </span>
          )}
          {entry.text && (
            <p className="mt-0.5 whitespace-pre-line text-pretty break-words text-[15px] leading-[1.55] text-foreground">
              {entry.text}
            </p>
          )}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-subtle">
            <span className="inline-flex items-center gap-1 font-medium">
              <LockClosedIcon
                aria-hidden="true"
                className="size-3 shrink-0"
                strokeWidth={1.8}
              />
              {entry.visibility === "private"
                ? t("visiblePrivate")
                : t("visibleLeaders", { name: firstNameOf(person.name) })}
            </span>
            {entry.source && <SourceLine source={entry.source} />}
          </span>
          {showActions && (canRecordNow(entry, today) || entry.canEdit) && (
            <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
              {canRecordNow(entry, today) && (
                <LogCareButton
                  ariaLabel={t("recordAria", { title, date })}
                  label={t("record")}
                  target={{ type: "complete", entry }}
                  today={today}
                  variant="record"
                />
              )}
              {entry.canEdit && (
                <LogCareButton
                  ariaLabel={t("editAria", { title, date })}
                  label={t("edit")}
                  target={{ type: "edit", entry }}
                  today={today}
                  variant="link"
                />
              )}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
