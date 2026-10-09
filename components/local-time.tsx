"use client";

import { FC } from "react";

import { LocalFormattedDate } from "@/components/local-formatted-date";
import { formatLocalTime } from "@/lib/format-date";

export interface LocalTimeProps {
  value: string;
}

export const LocalTime: FC<LocalTimeProps> = ({ value }) => (
  <LocalFormattedDate
    format={formatLocalTime}
    minWidthClass="min-w-16"
    value={value}
  />
);
