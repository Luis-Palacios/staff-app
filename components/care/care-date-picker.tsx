"use client";

import { parseDate } from "@internationalized/date";
import { Calendar, DateField, DatePicker, Label } from "@heroui/react";

/**
 * A date field with a calendar for "YYYY-MM-DD" values between `min` and `max` (either may be
 * left out). A done entry is never in the future (`max` = today); a plan is today or later (`min`).
 */
export function CareDatePicker({
  label,
  value,
  min,
  max,
  isInvalid,
  describedBy,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  isInvalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}) {
  const minValue = min ? parseDate(min) : undefined;
  const maxValue = max ? parseDate(max) : undefined;

  return (
    <DatePicker
      aria-describedby={describedBy}
      className="w-full gap-1.5"
      isInvalid={isInvalid}
      maxValue={maxValue}
      minValue={minValue}
      value={value ? parseDate(value) : null}
      onChange={(date) => date && onChange(date.toString())}
    >
      <Label className="text-sm font-semibold text-heading">{label}</Label>
      <DateField.Group fullWidth className="h-11">
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
        <Calendar aria-label={label} maxValue={maxValue} minValue={minValue}>
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
