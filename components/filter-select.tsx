"use client";

import { ListBox, Select } from "@heroui/react";

// A compact dropdown for a list page's filter row. No visible label: the selected option says
// what it filters ("All roles"), and `label` names it for screen readers.
export function FilterSelect<TKey extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: TKey; label: string }[];
  value: TKey;
  onChange: (value: TKey) => void;
}) {
  return (
    <Select.Root
      aria-label={label}
      className="w-full sm:w-[200px]"
      selectedKey={value}
      onSelectionChange={(key) => {
        if (key !== null) onChange(String(key) as TKey);
      }}
    >
      <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.key}
              id={option.key}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  );
}
