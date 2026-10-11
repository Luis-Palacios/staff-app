"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useLocale } from "next-intl";

import { formatLocalLongDate } from "@/lib/format-date";

// Both pieces read the browser's clock, locale and time zone, so they fill in
// after mount (like LocalFormattedDate) to avoid a hydration mismatch.
function useNowAfterMount(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return now;
}

export type Salutations = {
  morning: string;
  afternoon: string;
  evening: string;
};

function salutationFor(date: Date, salutations: Salutations): string {
  const hour = date.getHours();

  if (hour < 12) return salutations.morning;
  if (hour < 18) return salutations.afternoon;

  return salutations.evening;
}

const fadeIn = (ready: boolean) =>
  clsx("transition-opacity duration-150", ready ? "opacity-100" : "opacity-0");

// "Thursday, October 9", for the page header's eyebrow.
export function TodayDate() {
  const now = useNowAfterMount();
  const locale = useLocale();

  return (
    <span className={fadeIn(now !== null)}>
      {now ? formatLocalLongDate(now.toISOString(), locale) : " "}
    </span>
  );
}

// "Good afternoon, María", with the name in italic 400 as the canvas has it.
// The three salutations arrive translated from the page, so this client leaf
// needs no message namespace.
export function Greeting({
  firstName,
  salutations,
}: {
  firstName: string;
  salutations: Salutations;
}) {
  const now = useNowAfterMount();

  return (
    <>
      <span className={fadeIn(now !== null)}>
        {now ? salutationFor(now, salutations) : salutations.morning}
        {firstName && ","}
      </span>
      {firstName && (
        <>
          {" "}
          <span className="font-normal italic">{firstName}</span>
        </>
      )}
    </>
  );
}
