"use client";

import type { Weekday } from "@/api/small-groups-api/types";

import {
  ArrowRightIcon,
  ExclamationCircleIcon,
  ListBulletIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  Description,
  InputGroup,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { MeetingDatePicker } from "./meeting-date-picker";

import { ADDRESS_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { card, title } from "@/components/primitives";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

export interface FlowGroup {
  id: number;
  name: string;
  meetingDay: Weekday | null;
  meetingAddress: string | null;
}

export type AttendanceMode = "guided" | "quick";

export interface DateProblem {
  message: string;
  /** Set for a duplicate date, so the field can link to the report already filed. */
  existingReportId: number | null;
}

const labelClass = "text-[13px] font-semibold text-heading";

function ModeCard({
  icon,
  title: heading,
  body,
  selected,
  disabled,
  onPick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={clsx(
        card({ interactive: !disabled }),
        "flex min-h-[132px] flex-col gap-3 p-5 text-left outline-none",
        selected && "border-accent",
        disabled && "pointer-events-none opacity-50",
      )}
      disabled={disabled}
      type="button"
      onClick={onPick}
    >
      <span className="flex w-full items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
          {icon}
        </span>
        <ArrowRightIcon
          aria-hidden="true"
          className="size-5 text-muted"
          strokeWidth={1.8}
        />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-base font-semibold text-heading">{heading}</span>
        <span className="text-sm leading-snug text-muted">{body}</span>
      </span>
    </button>
  );
}

/**
 * Step 1 of the new report: group, date, address and how to take attendance. The mode cards
 * stay inert while the date has a report already (rule 1) or the roster isn't loaded.
 */
export function MeetingStep({
  groups,
  scoped,
  group,
  date,
  today,
  filedDates,
  dateProblem,
  address,
  mode,
  canChoose,
  rosterLoading,
  noPeople,
  onGroupChange,
  onDateChange,
  onAddressChange,
  onChooseMode,
  onCancel,
}: {
  groups: FlowGroup[];
  scoped: boolean;
  group: FlowGroup;
  date: string;
  today: string;
  filedDates: ReadonlySet<string>;
  dateProblem: DateProblem | null;
  address: string;
  mode: AttendanceMode | null;
  canChoose: boolean;
  rosterLoading: boolean;
  noPeople: boolean;
  onGroupChange: (groupId: number) => void;
  onDateChange: (date: string) => void;
  onAddressChange: (address: string) => void;
  onChooseMode: (mode: AttendanceMode) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("ReportForm");
  const tDays = useTranslations("Weekdays");

  return (
    <div className="flex max-w-[720px] flex-col gap-8">
      <section aria-labelledby="meeting-title" className={card({})}>
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
              {t("meetingEyebrow")}
            </p>
            <h2
              className={title({ size: "sm", className: "text-[22px]" })}
              id="meeting-title"
            >
              {t("meetingTitle")}
            </h2>
          </div>

          <Select.Root
            className="w-full gap-1.5"
            selectedKey={String(group.id)}
            onSelectionChange={(key) => {
              if (key !== null) onGroupChange(Number(key));
            }}
          >
            <Label className={labelClass}>{t("group")}</Label>
            <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Description className="text-[13px] text-muted">
              {scoped ? t("groupHint") : t("groupHintFull")}
            </Description>
            <Select.Popover>
              <ListBox>
                {groups.map((option) => (
                  <ListBox.Item
                    key={option.id}
                    id={String(option.id)}
                    textValue={option.name}
                  >
                    {option.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select.Root>

          <div className="flex flex-col gap-1.5">
            <MeetingDatePicker
              describedBy="meeting-date-help meeting-date-problem"
              filedDates={filedDates}
              isInvalid={dateProblem !== null}
              meetingDay={group.meetingDay}
              today={today}
              value={date}
              onChange={onDateChange}
            />
            <div id="meeting-date-problem">
              {dateProblem && (
                <p
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-danger"
                  role="alert"
                >
                  <ExclamationCircleIcon
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  />
                  <span>{dateProblem.message}</span>
                  {dateProblem.existingReportId !== null && (
                    <NextLink
                      className="font-semibold underline underline-offset-2"
                      href={`/groups/reports/${dateProblem.existingReportId}`}
                    >
                      {t("openExisting")}
                    </NextLink>
                  )}
                </p>
              )}
            </div>
            <p className="text-[13px] text-muted" id="meeting-date-help">
              {group.meetingDay === null
                ? t("dateHintNoDay")
                : t("dateHint", {
                    group: group.name,
                    weekday: tDays(
                      `sentence.${WEEKDAY_KEYS[group.meetingDay]}`,
                    ),
                  })}
            </p>
          </div>

          <TextField
            className="gap-1.5"
            maxLength={ADDRESS_MAX}
            name="address"
            value={address}
            onChange={onAddressChange}
          >
            <Label className={labelClass}>{t("address")}</Label>
            <InputGroup className="h-10 w-full rounded-control">
              <InputGroup.Input className="text-sm sm:text-sm" />
            </InputGroup>
            <Description className="text-[13px] text-muted">
              {t("addressHint")}
            </Description>
          </TextField>
        </div>
      </section>

      <section aria-labelledby="how-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2
            className={title({ size: "sm", className: "text-[22px]" })}
            id="how-title"
          >
            {t("howTitle")}
          </h2>
          <p className="text-sm text-muted">
            {noPeople ? t("noPeople") : t("howSub")}
          </p>
        </div>
        <div
          aria-busy={rosterLoading}
          className="grid gap-4 sm:grid-cols-2"
          inert={!canChoose}
        >
          <ModeCard
            body={t("guidedBody")}
            disabled={!canChoose}
            icon={<UserIcon aria-hidden="true" className="size-5" />}
            selected={mode === "guided"}
            title={t("guidedTitle")}
            onPick={() => onChooseMode("guided")}
          />
          <ModeCard
            body={t("quickBody")}
            disabled={!canChoose}
            icon={<ListBulletIcon aria-hidden="true" className="size-5" />}
            selected={mode === "quick"}
            title={t("quickTitle")}
            onPick={() => onChooseMode("quick")}
          />
        </div>
      </section>

      <div>
        <NextLink
          className="text-sm font-semibold text-heading underline underline-offset-4"
          href="/groups/reports"
          onClick={onCancel}
        >
          {t("cancel")}
        </NextLink>
      </div>
    </div>
  );
}
