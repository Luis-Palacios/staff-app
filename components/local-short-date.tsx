"use client";

import { FC } from "react";

import { LocalFormattedDate } from "@/components/local-formatted-date";
import { formatLocalShortDate } from "@/lib/format-date";

export interface LocalShortDateProps {
  value: string;
}

export const LocalShortDate: FC<LocalShortDateProps> = ({ value }) => (
  <LocalFormattedDate
    format={formatLocalShortDate}
    minWidthClass="min-w-12"
    value={value}
  />
);
