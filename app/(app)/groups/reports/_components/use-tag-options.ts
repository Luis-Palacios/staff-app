"use client";

import type { TaggablePerson } from "@/api/small-groups-api/types";
import type { PersonKey } from "@/lib/report-items";
import type {
  TagContext,
  TagSection,
} from "@/app/(app)/groups/reports/_lib/report-tags";

import { useEffect, useMemo, useState } from "react";

import { searchTaggablePeopleAction } from "@/app/(app)/groups/reports/_actions/tag-search-action";
import {
  churchSection,
  rosterSections,
} from "@/app/(app)/groups/reports/_lib/report-tags";
import { toPersonKey } from "@/lib/report-items";

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

/**
 * What the picker lists for `query`: the roster sections at once, and *Everyone else in the church*
 * once a debounced search comes back (2+ characters). A newer query cancels the one in flight, so a
 * slow answer for `pa` never replaces `pab`.
 */
export function useTagOptions({
  context,
  query,
  mode,
  itemText,
  tagged,
}: {
  context: TagContext;
  query: string;
  mode: "at" | "button";
  itemText: string;
  tagged: ReadonlySet<PersonKey>;
}): { sections: TagSection[]; searching: boolean; failed: boolean } {
  const trimmed = query.trim();
  const searchable = trimmed.length >= MIN_QUERY_LENGTH;
  const { groupId } = context;
  const [answer, setAnswer] = useState<{
    forQuery: string;
    people: TaggablePerson[] | null;
  } | null>(null);

  useEffect(() => {
    if (!searchable) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await searchTaggablePeopleAction(groupId, trimmed);

      if (!cancelled) {
        setAnswer({
          forQuery: trimmed,
          people: result.ok ? result.people : null,
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [groupId, searchable, trimmed]);

  const current = searchable && answer?.forQuery === trimmed ? answer : null;
  const sections = useMemo(() => {
    const local = rosterSections({ context, query, mode, itemText, tagged });
    const listed = new Set<PersonKey>([
      ...context.roster.map((row) => toPersonKey(row.person)),
      ...tagged,
    ]);
    const church = current?.people
      ? churchSection(current.people, listed)
      : null;

    return church ? [...local, church] : local;
  }, [context, query, mode, itemText, tagged, current]);

  return {
    sections,
    searching: searchable && current === null,
    failed: current !== null && current.people === null,
  };
}
