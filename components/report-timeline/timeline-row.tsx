import type {
  PersonTimeline,
  ReportSectionKey,
  TimelineItem,
  TimelineRow as Row,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  AtSymbolIcon,
  LockClosedIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { ReportPersonChip } from "@/app/(app)/groups/reports/_components/report-person-chip";
import { textLink } from "@/components/primitives";
import { ReportSectionTile } from "@/components/report-section-tile";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";
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
  compact = false,
}: {
  row: Row;
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
          {compact ? (
            // The preview has no *View report*: the date opens the report instead.
            <NextLink
              className="underline-offset-[3px] hover:underline"
              href={reportHref}
            >
              {formatCalendarShortWeekdayDate(row.meetingDate, locale)}
            </NextLink>
          ) : (
            formatCalendarShortWeekdayDate(row.meetingDate, locale)
          )}
        </p>
        <NextLink
          className="text-[13.5px] text-foreground underline decoration-border underline-offset-[3px] hover:decoration-current"
          href={`/groups/${row.smallGroup.id}`}
        >
          {row.smallGroup.name}
        </NextLink>
        {roleLabel && <p className="text-[13px] text-muted">{roleLabel}</p>}
        {!attendance && (
          <span className="inline-flex items-center gap-1 self-start whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[12.5px] font-semibold text-muted">
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
        {!compact && (
          <NextLink
            className={textLink({ className: "self-start text-[13.5px]" })}
            href={reportHref}
          >
            {t("viewReport")}
          </NextLink>
        )}
      </div>
    </li>
  );
}
