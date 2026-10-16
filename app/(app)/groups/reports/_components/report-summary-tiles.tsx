import type { ReportDetail } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { ComponentType, ReactNode, SVGProps } from "react";

import {
  BuildingLibraryIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getLocale, getTranslations } from "next-intl/server";

import { formatChurchSunday } from "@/app/(app)/groups/reports/_lib/format-church-sunday";
import { card, title } from "@/components/primitives";

function Tile({
  icon: Icon,
  label,
  children,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <div className={card({ className: "flex items-start gap-3.5 p-[18px]" })}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground">
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.6} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">
          {label}
        </p>
        {children}
        {note && <p className="text-[13px] text-muted">{note}</p>}
      </div>
    </div>
  );
}

// Meeting attendance, church attendance (with the Sunday it asks about) and where the group met.
export async function ReportSummaryTiles({ report }: { report: ReportDetail }) {
  const [t, locale] = await Promise.all([
    getTranslations("ReportDetail"),
    getLocale(),
  ]);
  const { totals, address, smallGroup, churchSunday } = report;
  const bigNumber = title({
    size: "sm",
    className: "text-[26px] tabular-nums",
  });
  const absent = totals.roster - totals.attendedGroup;
  const usual = address !== null && address === smallGroup.meetingAddress;

  return (
    <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
      <Tile
        icon={UserGroupIcon}
        label={t("tileMeeting")}
        note={absent > 0 ? t("tileAbsent", { count: absent }) : undefined}
      >
        <p className={bigNumber}>
          {t("ofTotal", { count: totals.attendedGroup, total: totals.roster })}
        </p>
      </Tile>
      <Tile
        icon={BuildingLibraryIcon}
        label={t("tileChurch")}
        note={formatChurchSunday(churchSunday, locale as Locale)}
      >
        <p className={bigNumber}>
          {t("ofTotal", { count: totals.attendedChurch, total: totals.roster })}
        </p>
      </Tile>
      <Tile
        icon={MapPinIcon}
        label={t("tileWhere")}
        note={usual ? t("usualAddress") : undefined}
      >
        <p className="text-[14.5px] font-semibold leading-snug text-heading">
          {address ?? t("noAddress")}
        </p>
      </Tile>
    </div>
  );
}
