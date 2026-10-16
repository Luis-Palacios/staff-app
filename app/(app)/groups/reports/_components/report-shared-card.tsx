import type { ReportDetail } from "@/api/small-groups-api/types";

import {
  ChatBubbleLeftRightIcon,
  HandRaisedIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import { card, testimony, title } from "@/components/primitives";

// What the group asked, thanked and left for the elders: three sections in the testimony style.
export async function ReportSharedCard({ report }: { report: ReportDetail }) {
  const t = await getTranslations("ReportDetail");
  const sections = [
    {
      key: "prayer",
      icon: HandRaisedIcon,
      label: t("prayer"),
      text: report.groupPrayerRequest,
    },
    {
      key: "praise",
      icon: SparklesIcon,
      label: t("praise"),
      text: report.groupPraiseReport,
    },
    {
      key: "discussion",
      icon: ChatBubbleLeftRightIcon,
      label: t("discussion"),
      text: report.groupRelevantDiscussion,
    },
  ];

  return (
    <section className={card({ className: "mb-5 flex flex-col gap-4 p-6" })}>
      <header className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-eyebrow">
          {t("fromGroup")}
        </p>
        <h2 className={title({ size: "sm", className: "text-[22px]" })}>
          {t("sharedTitle")}
        </h2>
      </header>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-x-6 gap-y-5">
        {sections.map(({ key, icon: Icon, label, text }) => (
          <div key={key} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-heading">
              <span className="flex size-7 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-foreground">
                <Icon aria-hidden="true" className="size-4" strokeWidth={1.7} />
              </span>
              {label}
            </h3>
            {text ? (
              <p className={testimony({ className: "whitespace-pre-line" })}>
                {text}
              </p>
            ) : (
              <p className="text-sm text-muted">{t("nothingShared")}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
