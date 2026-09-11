"use client";

import { FC, useEffect, useState } from "react";

import { formatLocalDateTime } from "@/lib/format-date";

export interface LocalDateTimeProps {
  value: string;
}

export const LocalDateTime: FC<LocalDateTimeProps> = ({ value }) => {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(formatLocalDateTime(value));
  }, [value]);

  if (!value) return <>—</>;

  return (
    <span
      className={`inline-block min-w-40 transition-opacity duration-150 ${
        formatted ? "opacity-100" : "opacity-0"
      }`}
    >
      {formatted || " "}
    </span>
  );
};
