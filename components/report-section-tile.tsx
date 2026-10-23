import type { ReportSectionKey } from "@/api/small-groups-api/types";

import { FlagIcon, HeartIcon, SparklesIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

/** Follow-up asks for action, so it gets the warning tone: on the tile and a count, never text. */
export const REPORT_SECTION_TONES = {
  prayer: "bg-accent-soft text-accent-soft-foreground",
  praise: "bg-success-soft text-success-soft-foreground",
  followUp: "bg-warning-soft text-warning-soft-foreground",
} as const satisfies Record<ReportSectionKey, string>;

const ICONS = {
  prayer: HeartIcon,
  praise: SparklesIcon,
  followUp: FlagIcon,
} as const satisfies Record<ReportSectionKey, unknown>;

// A report section's icon tile (heart, sparkles, flag) in its tone: the section cards on Prayer &
// follow-up and the conversation panel's header. `className` sets the size and radius.
export function ReportSectionTile({
  section,
  className,
  iconClassName,
}: {
  section: ReportSectionKey;
  className: string;
  iconClassName: string;
}) {
  const Icon = ICONS[section];

  return (
    <span
      aria-hidden="true"
      className={clsx(
        "flex shrink-0 items-center justify-center",
        REPORT_SECTION_TONES[section],
        className,
      )}
    >
      <Icon className={iconClassName} strokeWidth={1.7} />
    </span>
  );
}
