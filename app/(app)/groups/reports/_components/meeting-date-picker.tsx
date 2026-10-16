"use client";

import type { Weekday } from "@/api/small-groups-api/types";

import { parseDate } from "@internationalized/date";
import { Calendar, DateField, DatePicker, Label } from "@heroui/react";
import { useTranslations } from "next-intl";

import { weekdayOf } from "@/app/(app)/groups/reports/_lib/meeting-dates";

/**
 * The meeting date: a date field with a calendar popover. Future days are off, today is ringed,
 * the group's meeting weekday carries a hollow gold dot, a day that already has a report a filled
 * success dot and a day marked as no meeting a small filled subtle dot (shape and colour differ, so
 * it never rests on colour alone; the legend names all three).
 */
export function MeetingDatePicker({
  value,
  today,
  meetingDay,
  filedDates,
  noMeetingDates,
  isInvalid,
  describedBy,
  onChange,
}: {
  value: string;
  today: string;
  meetingDay: Weekday | null;
  filedDates: ReadonlySet<string>;
  noMeetingDates: ReadonlySet<string>;
  isInvalid: boolean;
  describedBy: string;
  onChange: (date: string) => void;
}) {
  const t = useTranslations("ReportForm");

  return (
    <DatePicker
      aria-describedby={describedBy}
      className="w-full gap-1.5"
      isInvalid={isInvalid}
      maxValue={parseDate(today)}
      value={parseDate(value)}
      onChange={(date) => {
        if (date) onChange(date.toString());
      }}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("date")}
      </Label>
      <DateField.Group fullWidth className="h-10">
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover>
        <Calendar aria-label={t("calendarLabel")} maxValue={parseDate(today)}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => {
                const iso = date.toString();
                const filed = filedDates.has(iso);
                const noMeeting = noMeetingDates.has(iso);
                const meets =
                  meetingDay !== null && weekdayOf(iso) === meetingDay;

                return (
                  <Calendar.Cell
                    className="data-[today=true]:ring-2 data-[today=true]:ring-accent"
                    date={date}
                  >
                    {({ formattedDate }) => (
                      <>
                        {formattedDate}
                        {(filed || noMeeting || meets) && (
                          <span
                            aria-hidden="true"
                            className={
                              filed
                                ? "absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-success"
                                : noMeeting
                                  ? "absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-subtle"
                                  : "absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full border-[1.5px] border-gold-500"
                            }
                          />
                        )}
                      </>
                    )}
                  </Calendar.Cell>
                );
              }}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-separator px-1 pt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full border-[1.5px] border-gold-500"
              />
              {t("legendMeets")}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-success"
              />
              {t("legendFiled")}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-subtle"
              />
              {t("legendNoMeeting")}
            </span>
          </div>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
