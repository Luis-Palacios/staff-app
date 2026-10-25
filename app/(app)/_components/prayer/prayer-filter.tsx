"use client";

import type { ReportSectionKey } from "@/api/small-groups-api/types";
import type { ReactNode } from "react";
import type { PrayerSectionView } from "./prayer-section";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";
import clsx from "clsx";

import { PrayerSection } from "./prayer-section";

import { normalizeText } from "@/lib/normalize-text";

type Filter = "all" | ReportSectionKey;

const SECTION_ORDER: ReportSectionKey[] = ["prayer", "praise", "followUp"];

/**
 * The filter chips (rule 10) and group/leader search over the sections. The entries are rendered on
 * the server and filtered here, so switching or searching never refetches. Page state, not in the
 * URL. Labels come translated from the server, so this needs no message namespace.
 */
export function PrayerFilter({
  label,
  allLabel,
  chips,
  searchLabel,
  searchPlaceholder,
  noMatches,
  note,
  sections,
}: {
  /** The group's accessible name ("Show"). */
  label: string;
  allLabel: string;
  chips: Record<ReportSectionKey, { label: string; count: number }>;
  searchLabel: string;
  searchPlaceholder: string;
  noMatches: string;
  /** Under the chips: the still-to-report note, or nothing. */
  note: ReactNode;
  sections: Record<ReportSectionKey, PrayerSectionView>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = useMemo(() => normalizeText(query), [query]);
  const options: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: allLabel },
    ...SECTION_ORDER.map((key) => ({ key, ...chips[key] })),
  ];

  return (
    <>
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div aria-label={label} className="flex flex-wrap gap-2" role="group">
            {options.map((option) => {
              const pressed = filter === option.key;

              return (
                <button
                  key={option.key}
                  aria-pressed={pressed}
                  className={clsx(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors md:min-h-10",
                    pressed
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-surface text-heading hover:bg-default",
                  )}
                  type="button"
                  onClick={() => setFilter(option.key)}
                >
                  {option.label}
                  {option.count !== undefined && (
                    <span
                      className={clsx(
                        "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[12.5px] font-bold tabular-nums",
                        pressed
                          ? "bg-accent-foreground/20 text-accent-foreground"
                          : "bg-default text-foreground",
                      )}
                    >
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <TextField
            aria-label={searchLabel}
            className="w-full sm:ml-auto sm:w-[280px]"
            type="search"
            value={query}
            onChange={setQuery}
          >
            <InputGroup className="h-10 w-full">
              <InputGroup.Prefix className="border-0 pl-3 pr-2">
                <MagnifyingGlassIcon
                  className="pointer-events-none size-4 shrink-0 text-muted"
                  strokeWidth={1.8}
                />
              </InputGroup.Prefix>
              <InputGroup.Input
                className="text-sm"
                placeholder={searchPlaceholder}
              />
            </InputGroup>
          </TextField>
        </div>
        {note}
      </div>
      {SECTION_ORDER.map((key) => (
        <div key={key} hidden={filter !== "all" && filter !== key}>
          <PrayerSection
            noMatches={noMatches}
            normalizedQuery={normalizedQuery}
            view={sections[key]}
          />
        </div>
      ))}
    </>
  );
}
