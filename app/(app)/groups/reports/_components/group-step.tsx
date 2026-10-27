"use client";

import type { ReportSectionKey } from "@/api/small-groups-api/types";
import type {
  DraftItem,
  DraftItems,
} from "@/app/(app)/groups/reports/_lib/report-items-draft";
import type { TagContext } from "@/app/(app)/groups/reports/_lib/report-tags";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AtSymbolIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { ReportItemsFields } from "./report-items-field";

import { card, title } from "@/components/primitives";

/** Step 3: what the group shared as a whole (prayer, praise, points for the elders). */
export function GroupStep({
  items,
  tagContext,
  onChange,
  onBack,
  onNext,
}: {
  items: DraftItems;
  tagContext: TagContext;
  onChange: (section: ReportSectionKey, items: DraftItem[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("ReportForm");
  const tItems = useTranslations("ReportItems");
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
        <p className="flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-[13.5px] text-accent-soft-foreground">
          <AtSymbolIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.8}
          />
          {tItems("tip")}
        </p>
        <ReportItemsFields
          items={items}
          layout="stacked"
          tagContext={tagContext}
          onChange={onChange}
        />
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
