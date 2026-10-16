import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import {
  type WeekRowView,
  WeekAttendance,
  WeekGroupCell,
  WeekObservations,
  WeekStatusCell,
} from "./week-rows";

import { dataTable, smallOutlineButton } from "@/components/data-table";

/** The week as a table, from `xl` up (five columns plus the sidebar don't fit at 1024). */
export async function WeekTable({ rows }: { rows: WeekRowView[] }) {
  const t = await getTranslations("GroupsDashboard");
  const { root, column, row, cell } = dataTable();

  const th = column({ className: "px-4 text-left" });
  const td = cell({ className: "px-4 align-middle" });

  // A native table, not HeroUI's: this block streams in behind Suspense, and react-aria's
  // collection rendering doesn't hydrate there. The slot classes are the shared data-table look.
  return (
    <div className={root({ className: "hidden xl:block" })}>
      <div className="overflow-x-auto">
        <table
          aria-label={t("weekSummary")}
          className="w-full min-w-[820px] border-collapse text-sm"
        >
          <thead>
            <tr>
              <th className={th} scope="col">
                {t("colGroup")}
              </th>
              <th className={th} scope="col">
                {t("colStatus")}
              </th>
              <th className={th} scope="col">
                {t("colAttendance")}
              </th>
              <th className={th} scope="col">
                {t("colObservations")}
              </th>
              <th className={th} scope="col">
                <span className="sr-only">{t("colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className={row()}>
                <td className={td}>
                  <WeekGroupCell noLeader={t("noLeader")} row={item} />
                </td>
                <td className={td}>
                  <WeekStatusCell row={item} />
                </td>
                <td className={td}>
                  <WeekAttendance row={item} />
                </td>
                <td className={td}>
                  <WeekObservations row={item} />
                </td>
                <td className={cell({ className: "px-4 text-right" })}>
                  <NextLink
                    aria-label={item.action.ariaLabel}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                      className: `${smallOutlineButton} gap-1.5`,
                    })}
                    href={item.action.href}
                  >
                    {item.action.label}
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={2}
                    />
                  </NextLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
