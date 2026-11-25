import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { card, title } from "@/components/primitives";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";

/**
 * Rule 57: one page for every way an entry can be out of reach (outside the audience, deleted, an
 * unknown or malformed id, no `careLog: view`), so it never says which.
 */
export default async function CareLogEntryNotFound() {
  const t = await getTranslations("CareLog.entry");

  return (
    <div className="flex max-w-[900px] flex-col gap-5">
      <StaffAppBreadcrumbs
        items={[
          { labelKey: "careCalendar", href: "/care/calendar" },
          { label: t("notFoundCrumb"), href: "/care/calendar" },
        ]}
      />
      <section
        className={card({
          className: "flex flex-col items-center gap-3 px-6 py-12 text-center",
        })}
      >
        <span className="flex size-[52px] items-center justify-center rounded-full bg-default text-foreground">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="size-6"
            strokeWidth={1.7}
          />
        </span>
        <h1 className={title({ size: "sm", className: "text-[28px]" })}>
          {t("notFoundTitle")}
        </h1>
        <p className="max-w-[440px] text-[15px] leading-[1.55] text-muted">
          {t("notFoundBody")}
        </p>
        <NextLink
          className={buttonVariants({
            variant: "primary",
            className: "mt-1.5 h-11 px-4 text-[14.5px] font-semibold",
          })}
          href="/care/calendar"
          prefetch={false}
        >
          {t("toCalendar")}
        </NextLink>
      </section>
    </div>
  );
}
