import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";
import type { Settled } from "@/lib/settle";

import { Suspense } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@heroui/react/skeleton";
import clsx from "clsx";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";

import { ApplicationStatusBadge } from "../applications/_components/application-status-badge";

import { InitialsAvatar } from "@/components/initials-avatar";
import { LocalShortDate } from "@/components/local-short-date";
import { card, textLink, title } from "@/components/primitives";

const RECENT_LIMIT = 5;

const row =
  "flex items-center gap-3.5 border-t border-separator px-[22px] py-[13px]";

async function RecentApplicationsList({
  applications,
}: {
  applications: Promise<Settled<ApplicationMembershipSummary[]>>;
}) {
  const [result, t] = await Promise.all([
    applications,
    getTranslations("RecentApplicationsCard"),
  ]);

  if (!result.ok) {
    return <p className={clsx(row, "text-sm text-danger")}>{t("error")}</p>;
  }

  // ISO dates sort as strings, newest first.
  const recent = [...result.value]
    .sort((a, b) => b.generatedDate.localeCompare(a.generatedDate))
    .slice(0, RECENT_LIMIT);

  if (recent.length === 0) {
    return <p className={clsx(row, "text-sm text-muted")}>{t("empty")}</p>;
  }

  return (
    <ul>
      {recent.map((application) => (
        <li key={application.applicationId}>
          {/* Inset focus ring: the card's overflow-hidden would clip the
              global halo at the left and right edges. */}
          <NextLink
            className={clsx(
              row,
              "transition-colors hover:bg-surface-secondary/50 focus-visible:shadow-[inset_0_0_0_2px_var(--focus)]",
            )}
            href={`/applications/${application.applicationId}`}
          >
            <InitialsAvatar name={application.personFullName} size="md" />
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="truncate text-[15px] font-semibold text-heading">
                {application.personFullName}
              </span>
              <span className="truncate text-[13px] text-muted">
                {t.rich("meta", {
                  id: String(application.applicationId),
                  date: () => (
                    <LocalShortDate value={application.generatedDate} />
                  ),
                })}
              </span>
            </span>
            <ApplicationStatusBadge isFulfilled={application.isFulfilled} />
            <ChevronRightIcon
              aria-hidden="true"
              className="hidden size-4 shrink-0 text-subtle sm:block"
              strokeWidth={2}
            />
          </NextLink>
        </li>
      ))}
    </ul>
  );
}

function RecentApplicationsListSkeleton() {
  return (
    <ul>
      {Array.from({ length: RECENT_LIMIT }, (_, index) => (
        <li key={index} className={row}>
          <Skeleton className="size-[38px] shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3.5 w-56 max-w-full rounded" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

// The five newest applications. The header renders straight away; only the
// rows wait on the fetch.
export async function RecentApplicationsCard({
  applications,
}: {
  applications: Promise<Settled<ApplicationMembershipSummary[]>>;
}) {
  const t = await getTranslations("RecentApplicationsCard");

  return (
    <section
      className={card({
        className: "min-w-0 flex-[2_1_560px] overflow-hidden",
      })}
    >
      <div className="flex items-center justify-between gap-3 px-[22px] pb-3.5 pt-5">
        <div>
          <h2 className={title({ size: "sm" })}>{t("title")}</h2>
          <p className="mt-0.5 text-[13.5px] text-muted">{t("subtitle")}</p>
        </div>
        <NextLink
          className={textLink({ className: "whitespace-nowrap text-sm" })}
          href="/applications"
        >
          {t("viewAll")}
        </NextLink>
      </div>
      <Suspense fallback={<RecentApplicationsListSkeleton />}>
        <RecentApplicationsList applications={applications} />
      </Suspense>
    </section>
  );
}
