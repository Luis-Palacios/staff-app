import type { GuestInactiveReason } from "@/api/guests-api/types";
import type { MemberInactiveReason } from "@/api/members-api/types";
import type {
  PersonTimeline,
  ReportSectionKey,
  TimelineItem,
  TimelineRow as Row,
  TimelineStatusEntry,
} from "@/api/small-groups-api/types";
import type { OpenGroups } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/locale-shared";

import {
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  AtSymbolIcon,
  LockClosedIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { ReportPersonChip } from "@/app/(app)/groups/reports/_components/report-person-chip";
import {
  GuestInactiveReasonChip,
  InactiveReasonChip,
} from "@/components/inactive-reason-chip";
import { textLink } from "@/components/primitives";
import { ReportSectionTile } from "@/components/report-section-tile";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarRowDate } from "@/lib/format-date";
import { personHref } from "@/lib/person-href";
import { shortNames, toPersonKey } from "@/lib/report-items";

const SECTIONS: ReportSectionKey[] = ["prayer", "praise", "followUp"];

/** One block (a note, or a section's items) with its tile and title. */
function Block({
  title,
  tile,
  hint,
  children,
}: {
  title: string;
  tile: React.ReactNode;
  /** The audience note with a lock (notes and follow-up are private). */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {tile}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <h4 className="text-[12.5px] font-semibold text-muted">{title}</h4>
          {hint && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <LockClosedIcon
                aria-hidden="true"
                className="size-3"
                strokeWidth={1.8}
              />
              {hint}
            </span>
          )}
        </div>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}

function ItemList({
  items,
  person,
  names,
}: {
  items: TimelineItem[];
  person: PersonTimeline["person"];
  names: ReturnType<typeof shortNames>;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-gold-500"
          />
          <p className="min-w-0 text-pretty text-[15px] leading-[1.6] text-foreground">
            {item.segments.map((segment, index) => {
              if (segment.type === "text") {
                return <span key={index}>{segment.text}</span>;
              }

              const own = toPersonKey(segment.person) === toPersonKey(person);

              return (
                <ReportPersonChip
                  key={index}
                  highlighted={own}
                  href={
                    !own && segment.person.viewable
                      ? personHref(segment.person)
                      : undefined
                  }
                  label={
                    names.get(toPersonKey(segment.person)) ??
                    segment.person.name
                  }
                  person={segment.person}
                />
              );
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * One held report in a person's timeline (rule 21): date, group, their role (or *Tagged in this
 * report* when only a tag is visible), attendance, the note about them and only the items that tag
 * them. `compact` is the Recent activity preview: a narrower date column, and the date links to the report instead of a *View report* link.
 */
export function TimelineRow({
  row,
  person,
  openGroups,
  compact = false,
}: {
  row: Row;
  /** The groups whose page and report the viewer can open; the rest would 404. */
  openGroups: OpenGroups;
  person: PersonTimeline["person"];
  compact?: boolean;
}) {
  const t = useTranslations("ReportTimeline");
  const tRole = useTranslations("SmallGroupRole");
  // A guest's roster role is always "member": they are participants.
  const roleLabel =
    row.attendance?.role &&
    (person.type === "guest" ? t("guestRole") : tRole(row.attendance.role));
  const locale = useLocale() as Locale;
  const { attendance, observation } = row;
  const names = shortNames(row.items);
  // A row that is only follow-up opens the report on that section's conversation panel.
  const onlyFollowUp =
    !observation &&
    row.items.length > 0 &&
    row.items.every((item) => item.section === "followUp");
  const canOpen =
    openGroups === "all" || openGroups.includes(row.smallGroup.id);
  const reportHref = `/groups/reports/${row.reportId}${onlyFollowUp ? "?section=followUp" : ""}`;

  return (
    <li
      className={clsx(
        "flex flex-col gap-3 border-b border-separator px-4 py-[18px] last:border-b-0 md:px-6",
        "md:flex-row md:flex-wrap md:gap-x-6",
      )}
    >
      <div
        className={clsx(
          "flex shrink-0 flex-col gap-1.5",
          compact ? "md:w-[172px]" : "md:w-[190px]",
        )}
      >
        <p className="text-[15px] font-semibold text-heading">
          {compact && canOpen ? (
            // The preview has no *View report*: the date opens the report instead.
            <NextLink
              className="underline-offset-[3px] hover:underline"
              href={reportHref}
            >
              {formatCalendarRowDate(row.meetingDate, locale)}
            </NextLink>
          ) : (
            formatCalendarRowDate(row.meetingDate, locale)
          )}
        </p>
        {canOpen ? (
          <NextLink
            className="text-[13.5px] text-foreground underline decoration-border underline-offset-[3px] hover:decoration-current"
            href={`/groups/${row.smallGroup.id}`}
          >
            {row.smallGroup.name}
          </NextLink>
        ) : (
          <span className="text-[13.5px] text-foreground">
            {row.smallGroup.name}
          </span>
        )}
        {roleLabel && <p className="text-[13px] text-muted">{roleLabel}</p>}
        {!attendance && (
          <span className="inline-flex items-center gap-1 self-start whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-muted">
            <AtSymbolIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            {t("taggedOnly")}
          </span>
        )}
      </div>
      <div className="flex min-w-[min(260px,100%)] flex-1 flex-col gap-4">
        {attendance && (
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge
              tone={attendance.attendedGroup ? "success" : "warning"}
              variant={attendance.attendedGroup ? "solid-dot" : "ring-dot"}
            >
              {attendance.attendedGroup ? t("came") : t("didntCome")}
            </StatusBadge>
            <StatusBadge
              tone={attendance.attendedChurch ? "success" : "neutral"}
              variant={attendance.attendedChurch ? "solid-dot" : "ring-dot"}
            >
              {attendance.attendedChurch ? t("atChurch") : t("notAtChurch")}
            </StatusBadge>
          </div>
        )}
        {observation && (
          <Block
            hint={t("notePrivate")}
            tile={
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-default text-muted"
              >
                <PencilSquareIcon className="size-4" strokeWidth={1.7} />
              </span>
            }
            title={t("noteFrom", { name: observation.submittedBy.name })}
          >
            <p className="text-pretty text-[15px] leading-[1.6] text-foreground">
              {observation.text}
            </p>
          </Block>
        )}
        {SECTIONS.map((section) => {
          const items = row.items.filter((item) => item.section === section);

          if (items.length === 0) return null;

          return (
            <Block
              key={section}
              hint={section === "followUp" ? t("followPrivate") : undefined}
              tile={
                <ReportSectionTile
                  className="size-7 rounded-lg"
                  iconClassName="size-4"
                  section={section}
                />
              }
              title={t(section)}
            >
              <ItemList items={items} names={names} person={person} />
            </Block>
          );
        })}
        {!compact && canOpen && (
          <NextLink
            className={textLink({
              className:
                "inline-flex min-h-8 items-center self-start text-[13.5px]",
            })}
            href={reportHref}
          >
            {t("viewReport")}
          </NextLink>
        )}
      </div>
    </li>
  );
}

/**
 * A change of status in a person's timeline (inactive guests, rule 12): shaded like a month
 * heading, with no group and no *View report*. Everyone who can open the timeline sees the reason
 * and note (rule 13). *by …* is left out when no member is linked to whoever made the change.
 */
export function TimelineStatusRow({
  entry,
  person,
  compact = false,
}: {
  entry: TimelineStatusEntry;
  person: PersonTimeline["person"];
  compact?: boolean;
}) {
  const t = useTranslations("ReportTimeline");
  const locale = useLocale() as Locale;
  const inactive = entry.status === "inactive";
  const Icon = inactive ? ArchiveBoxIcon : ArrowUturnLeftIcon;

  return (
    <li className="flex flex-col gap-3 border-b border-separator bg-surface-secondary/50 px-4 py-[18px] last:border-b-0 md:flex-row md:flex-wrap md:gap-x-6 md:px-6">
      <div
        className={clsx(
          "flex shrink-0 flex-col gap-1",
          compact ? "md:w-[172px]" : "md:w-[190px]",
        )}
      >
        <p className="text-[15px] font-semibold text-heading">
          {formatCalendarRowDate(entry.date, locale)}
        </p>
        <p className="text-[13px] text-muted">{t("statusChange")}</p>
      </div>
      <div className="flex min-w-[min(260px,100%)] flex-1 gap-3">
        <span
          aria-hidden="true"
          className={clsx(
            "flex size-[30px] shrink-0 items-center justify-center rounded-[9px]",
            inactive
              ? "bg-default text-muted"
              : "bg-success-soft text-success-soft-foreground",
          )}
        >
          <Icon className="size-4" strokeWidth={1.7} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[15px] font-semibold text-heading">
              {inactive ? t("markedInactive") : t("reactivated")}
            </span>
            {person.type === "guest" ? (
              <GuestInactiveReasonChip
                reason={entry.reason as GuestInactiveReason | null}
              />
            ) : (
              <InactiveReasonChip
                reason={entry.reason as MemberInactiveReason | null}
              />
            )}
          </span>
          {entry.changedBy && (
            <span className="text-[13px] text-muted">
              {t("statusBy", { name: entry.changedBy.name })}
            </span>
          )}
          {entry.note && (
            <p className="mt-0.5 text-pretty break-words text-[15px] leading-[1.55] text-foreground">
              {entry.note}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
