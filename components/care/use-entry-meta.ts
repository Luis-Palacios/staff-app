"use client";

import type { CareLogEntry } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { formatList } from "@/lib/format-list";

/**
 * The small line under an entry on the care calendar: where a meeting was, and who planned or
 * logged it and who was with them, with the viewer as "you" ("planned by you with Elena Morales").
 */
export function useEntryMeta(
  viewerMemberId: number | null,
): (entry: CareLogEntry) => string {
  const t = useTranslations("CareLog");
  const c = useTranslations("CareCalendar");
  const locale = useLocale() as Locale;

  return (entry) => {
    const planned = entry.status === "planned";
    const name = (member: { memberId: number; name: string }) =>
      member.memberId === viewerMemberId ? c("you") : member.name;
    const author = name(entry.author);
    const bits: string[] = [];

    if (entry.meetingMode) {
      bits.push(
        entry.meetingMode === "online" ? t("modeOnline") : t("modeInPerson"),
      );
    }

    if (entry.kind === "heard") {
      if (entry.heardFrom) bits.push(entry.heardFrom);

      bits.push(t("metaLoggedBy", { name: author }));
    } else if (entry.participants.length > 0) {
      const names = formatList(entry.participants.map(name), locale);

      bits.push(
        planned
          ? t("metaPlannedByWith", { name: author, names })
          : t("metaByWith", { name: author, names }),
      );
    } else {
      bits.push(
        planned
          ? t("metaPlannedBy", { name: author })
          : t("metaBy", { name: author }),
      );
    }

    return bits.join(" · ");
  };
}
