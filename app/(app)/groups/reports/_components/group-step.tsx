"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { GroupFields, type GroupTextField } from "./group-fields";

import { card, title } from "@/components/primitives";

/** Step 3: what the group shared as a whole (prayer, praise, points for the elders). */
export function GroupStep({
  values,
  onChange,
  onBack,
  onNext,
}: {
  values: Record<GroupTextField, string>;
  onChange: (field: GroupTextField, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("ReportForm");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="group-title"
      className={card({ className: "max-w-[720px] overflow-hidden" })}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("groupEyebrow")}
          </p>
          <h2
            ref={headingRef}
            className={title({
              size: "sm",
              className: "text-[22px] outline-none",
            })}
            id="group-title"
            tabIndex={-1}
          >
            {t("groupTitle")}
          </h2>
          <p className="text-sm text-muted">{t("groupSub")}</p>
        </div>
        <GroupFields layout="stacked" values={values} onChange={onChange} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-separator bg-surface-secondary/50 px-5 py-4 sm:px-6">
        <Button
          className="gap-2 font-semibold"
          variant="outline"
          onPress={onBack}
        >
          <ArrowLeftIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
          {t("back")}
        </Button>
        <Button className="gap-2 font-semibold" onPress={onNext}>
          {t("toReview")}
          <ArrowRightIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </Button>
      </div>
    </section>
  );
}
