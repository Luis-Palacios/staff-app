"use client";

import { FC } from "react";

import { LocalFormattedDate } from "@/components/local-formatted-date";
import { formatLocalDate } from "@/lib/format-date";

export interface LocalDateProps {
  value: string;
}

export const LocalDate: FC<LocalDateProps> = ({ value }) => (
  <LocalFormattedDate
    format={formatLocalDate}
    minWidthClass="min-w-24"
    value={value}
  />
);
