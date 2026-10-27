import type { ReportItem } from "@/api/small-groups-api/types";

import clsx from "clsx";

import { ReportPersonChip } from "./report-person-chip";

import { personHref } from "@/lib/person-href";
import { shortNames, toPersonKey } from "@/lib/report-items";

/**
 * A section's items (rules 14–16): a gold dot each (decorative, never text), the segments with
 * tagged people as chips. A chip whose person the viewer may open (`viewable`, rule 12) is a link;
 * otherwise it's plain. Chip names are worked out from the items given, so pass the report's items
 * when a name could clash across sections.
 */
export function ReportItemList({
  items,
  nameItems,
  className,
  textClassName,
}: {
  items: readonly ReportItem[];
  /** Every item of the report, for first-name clashes (rule 11); defaults to `items`. */
  nameItems?: readonly ReportItem[];
  className?: string;
  /** Text size and measure, e.g. `text-[15.5px] max-w-[72ch]`. */
  textClassName?: string;
}) {
  const names = shortNames(nameItems ?? items);

  return (
    <ul className={clsx("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-gold-500"
          />
          <p
            className={clsx(
              "min-w-0 text-pretty leading-[1.6] text-foreground",
              textClassName ?? "text-[15.5px]",
            )}
          >
            {item.segments.map((segment, index) =>
              segment.type === "text" ? (
                <span key={index}>{segment.text}</span>
              ) : (
                <ReportPersonChip
                  key={index}
                  href={
                    segment.person.viewable
                      ? personHref(segment.person)
                      : undefined
                  }
                  label={
                    names.get(toPersonKey(segment.person)) ??
                    segment.person.name
                  }
                  person={segment.person}
                />
              ),
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
