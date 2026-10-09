"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

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

function salutationFor(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

const fadeIn = (ready: boolean) =>
  clsx("transition-opacity duration-150", ready ? "opacity-100" : "opacity-0");

// "Thursday, October 9", for the page header's eyebrow.
export function TodayDate() {
  const now = useNowAfterMount();

  return (
    <span className={fadeIn(now !== null)}>
      {now ? formatLocalLongDate(now.toISOString()) : " "}
    </span>
  );
}

// "Good afternoon, María", with the name in italic 400 as the canvas has it.
export function Greeting({ firstName }: { firstName: string }) {
  const now = useNowAfterMount();

  return (
    <>
      <span className={fadeIn(now !== null)}>
        {now ? salutationFor(now) : "Good morning"}
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
