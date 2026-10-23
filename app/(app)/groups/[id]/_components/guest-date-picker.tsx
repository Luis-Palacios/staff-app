"use client";

import { parseDate } from "@internationalized/date";
import { Calendar, DateField, DatePicker, Label } from "@heroui/react";

// A date field with a calendar, for "YYYY-MM-DD" values that can't be after `max`.
export function GuestDatePicker({
  label,
  note,
  value,
  max,
  isDisabled,
  onChange,
}: {
  label: string;
  note?: string;
  value: string;
  max: string;
  isDisabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <DatePicker
      className="w-full gap-1.5"
      isDisabled={isDisabled}
      maxValue={parseDate(max)}
      value={parseDate(value)}
      onChange={(date) => onChange(date ? date.toString() : max)}
    >
      <Label className="text-[13px] font-semibold text-heading">{label}</Label>
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
      {note && <p className="text-[13px] text-muted">{note}</p>}
      <DatePicker.Popover>
        <Calendar aria-label={label} maxValue={parseDate(max)}>
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
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
