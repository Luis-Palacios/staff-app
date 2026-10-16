"use client";

import { CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";

const STEP_KEYS = [
  "stepMeeting",
  "stepPeople",
  "stepGroup",
  "stepReview",
] as const;

/** The four steps of the guided flow. `current` is 1-based; done steps show a check. */
export function ReportStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const t = useTranslations("ReportForm");

  return (
    <nav aria-label={t("stepsLabel")}>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {STEP_KEYS.map((key, position) => {
          const number = position + 1;
          const done = number < current;
          const active = number === current;

          return (
            <li
              key={key}
              aria-current={active ? "step" : undefined}
              className={clsx(
                "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-semibold",
                active && "bg-accent-soft text-accent-soft-foreground",
                done && "text-heading",
                !active && !done && "text-muted",
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "flex size-5 items-center justify-center rounded-full text-[11px]",
                  active || done
                    ? "bg-accent text-accent-foreground"
                    : "bg-default text-muted",
                )}
              >
                {done ? (
                  <CheckIcon className="size-3" strokeWidth={3} />
                ) : (
                  number
                )}
              </span>
              {t(key)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
