"use client";

import { FC } from "react";

import { LocalFormattedDate } from "@/components/local-formatted-date";
import { formatLocalDateTime } from "@/lib/format-date";

export interface LocalDateTimeProps {
  value: string;
}

export const LocalDateTime: FC<LocalDateTimeProps> = ({ value }) => (
  <LocalFormattedDate
    format={formatLocalDateTime}
    minWidthClass="min-w-40"
    value={value}
  />
);
