"use client";

import type { ReportRoster } from "@/api/small-groups-api/types";
import type {
  AttendanceMode,
  FlowGroup,
} from "@/app/(app)/groups/reports/_components/meeting-step";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { MeetingStep } from "./meeting-step";

import {
  getReportRosterAction,
  listFiledDatesAction,
} from "@/app/(app)/groups/reports/_actions/report-actions";
import { defaultMeetingDate } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type ReportDraft,
} from "@/app/(app)/groups/reports/_lib/report-draft";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { title } from "@/components/primitives";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";

/** What the roster call said about the chosen group and date. */
type RosterState =
  | { status: "loading" }
  | { status: "ready"; roster: ReportRoster; existsMessage: string | null }
  | { status: "error"; message: string };

const TOTAL_STEPS = 4;

function emptyDraft(address: string): ReportDraft {
  return { address, prayer: "", praise: "", discussion: "", answers: {} };
}

/**
 * The whole new-report flow: it holds the group, date, address and mode, asks the API who belongs
 * on the report for that date, and keeps an unsent draft in the browser. Today it renders the
 * meeting step; the later steps hang off the same state.
 */
export function ReportFlow({
  groups,
  scoped,
  today,
  initialGroupId,
  initialDate,
  initialFiledDates,
  initialRoster,
}: {
  groups: FlowGroup[];
  scoped: boolean;
  today: string;
  initialGroupId: number;
  initialDate: string;
  initialFiledDates: string[];
  initialRoster: Extract<RosterState, { status: "ready" }> | null;
}) {
  const t = useTranslations("ReportForm");
  const [groupId, setGroupId] = useState(initialGroupId);
  const [date, setDate] = useState(initialDate);
  const [filedDates, setFiledDates] = useState(
    () => new Set(initialFiledDates),
  );
  const [roster, setRoster] = useState<RosterState>(
    initialRoster ?? { status: "loading" },
  );
  const group = groups.find((option) => option.id === groupId) ?? groups[0];
  const [address, setAddress] = useState(group.meetingAddress ?? "");
  const [mode, setMode] = useState<AttendanceMode | null>(null);
  // The group and date the roster below belongs to, so the first render doesn't ask again.
  const loadedFor = useRef<string | null>(
    initialRoster ? `${initialGroupId}:${initialDate}` : null,
  );
  const addressEdited = useRef(false);

  // Every group or date change: restore a draft for that pair, then ask who belongs on the report.
  useEffect(() => {
    const key = `${groupId}:${date}`;
    const draft = loadDraft(groupId, date);

    if (draft) {
      setAddress(draft.address);
      addressEdited.current = true;
    } else if (!addressEdited.current) {
      setAddress(group.meetingAddress ?? "");
    }

    if (loadedFor.current === key) return;

    let cancelled = false;

    loadedFor.current = key;
    setRoster({ status: "loading" });
    setMode(null);

    void getReportRosterAction(groupId, date).then((result) => {
      if (cancelled) return;

      setRoster(
        result.ok
          ? {
              status: "ready",
              roster: result.roster,
              existsMessage: result.existsMessage,
            }
          : { status: "error", message: result.message },
      );
    });

    return () => {
      cancelled = true;
      loadedFor.current = null;
    };
  }, [groupId, date, group.meetingAddress]);

  function changeGroup(nextId: number) {
    if (nextId === groupId) return;

    const next = groups.find((option) => option.id === nextId);

    if (!next) return;

    // The new group's filed dates decide its starting date, so switch group and date together.
    void listFiledDatesAction(nextId, today).then((dates) => {
      const filed = new Set(dates);

      addressEdited.current = false;
      setFiledDates(filed);
      setGroupId(nextId);
      setAddress(next.meetingAddress ?? "");
      setDate(
        defaultMeetingDate({
          today,
          meetingDay: next.meetingDay,
          filedDates: filed,
        }),
      );
    });
  }

  function changeAddress(value: string) {
    addressEdited.current = true;
    setAddress(value);
    saveDraft(groupId, date, {
      ...(loadDraft(groupId, date) ?? emptyDraft(value)),
      address: value,
    });
  }

  function chooseMode(next: AttendanceMode) {
    setMode(next);
    saveDraft(groupId, date, {
      ...(loadDraft(groupId, date) ?? emptyDraft(address)),
      address,
    });
  }

  function cancel() {
    clearDraft(groupId, date);
  }

  const ready = roster.status === "ready" ? roster : null;
  const exists = ready?.roster.existingReportId ?? null;
  const dateProblem =
    ready && exists !== null
      ? { message: ready.existsMessage ?? "", existingReportId: exists }
      : roster.status === "error"
        ? { message: roster.message, existingReportId: null }
        : null;
  const noPeople = ready !== null && ready.roster.people.length === 0;

  return (
    <>
      {/* Phone: a focused task header replaces the top bar. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-1 border-b border-border bg-background px-2 md:hidden">
        <NextLink
          aria-label={t("close")}
          className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary"
          href="/groups/reports"
          onClick={cancel}
        >
          <XMarkIcon aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </NextLink>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={title({ size: "sm", className: "text-xl" })}>
            {t("newTitle")}
          </span>
          <span className="truncate text-[13px] text-muted">{group.name}</span>
        </div>
        <span className="pr-2 text-sm font-semibold text-muted tabular-nums">
          {t("stepCount", { current: 1, total: TOTAL_STEPS })}
        </span>
      </header>

      <div className="hidden md:block">
        <StaffAppPageHeader
          breadcrumbs={[
            groupsBreadcrumb,
            groupsReportsBreadcrumb,
            { label: t("newTitle"), href: "/groups/reports/new" },
          ]}
          eyebrow={group.name}
          title={t("newTitle")}
        />
      </div>

      <MeetingStep
        address={address}
        canChoose={ready !== null && exists === null && !noPeople}
        date={date}
        dateProblem={dateProblem}
        filedDates={filedDates}
        group={group}
        groups={groups}
        mode={mode}
        noPeople={noPeople}
        rosterLoading={roster.status === "loading"}
        scoped={scoped}
        today={today}
        onAddressChange={changeAddress}
        onCancel={cancel}
        onChooseMode={chooseMode}
        onDateChange={setDate}
        onGroupChange={changeGroup}
      />
    </>
  );
}
