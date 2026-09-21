"use client";

import { FC, useEffect, useState } from "react";

export interface LocalFormattedDateProps {
  value: string;
  format: (iso: string) => string;
  minWidthClass: string;
}

// Formats after mount so the output uses the browser's locale and time zone,
// avoiding a server/client hydration mismatch.
export const LocalFormattedDate: FC<LocalFormattedDateProps> = ({
  value,
  format,
  minWidthClass,
}) => {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(format(value));
  }, [value, format]);

  if (!value) return <>—</>;

  return (
    <span
      className={`inline-block ${minWidthClass} transition-opacity duration-150 ${
        formatted ? "opacity-100" : "opacity-0"
      }`}
    >
      {formatted || " "}
    </span>
  );
};
