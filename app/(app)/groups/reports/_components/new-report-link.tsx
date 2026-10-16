import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

const buttonClass = "h-[42px] gap-2 px-[18px] md:h-[42px]";

/**
 * "New report" for the page header. A full role with no linked member gets it
 * disabled, with the reason as a line under it (rule 5), as the board shows.
 */
export async function NewReportLink({ canSubmit }: { canSubmit: boolean }) {
  const t = await getTranslations("ReportsPage");
  const plus = (
    <PlusIcon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
  );

  if (canSubmit) {
    return (
      <NextLink
        className={buttonVariants({
          variant: "primary",
          className: buttonClass,
        })}
        href="/groups/reports/new"
      >
        {plus}
        {t("newReport")}
      </NextLink>
    );
  }

  return (
    <div className="flex max-w-[280px] flex-col items-start gap-1.5">
      <Button
        isDisabled
        aria-describedby="new-report-reason"
        className={buttonClass}
        variant="primary"
      >
        {plus}
        {t("newReport")}
      </Button>
      <p className="text-[13px] leading-snug text-muted" id="new-report-reason">
        {t("linkReason")}
      </p>
    </div>
  );
}
