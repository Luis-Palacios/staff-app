"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";

// The list-page search box (same look as the members page's). Labels come in translated.
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      aria-label={label}
      className="w-full sm:w-[300px]"
      type="search"
      value={value}
      onChange={onChange}
    >
      <InputGroup className="h-10 w-full">
        <InputGroup.Prefix className="border-0 pl-3 pr-2">
          <MagnifyingGlassIcon
            className="pointer-events-none size-4 shrink-0 text-muted"
            strokeWidth={1.8}
          />
        </InputGroup.Prefix>
        <InputGroup.Input className="text-sm" placeholder={placeholder} />
      </InputGroup>
    </TextField>
  );
}
