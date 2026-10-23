import type { GuestDetail } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import { ArrowLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { GuestsBadge } from "@/components/guests-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { title } from "@/components/primitives";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";
import { groupsBreadcrumb, guestsBreadcrumb } from "@/config/breadcrumbs";
import { formatCalendarDate } from "@/lib/format-date";

// The person is the page, as on the member detail. Someone with the Guests list (`guests: view` +
// `all`) comes from it; a leader comes from their group, so the breadcrumb and the back button go
// there.
export function GuestDetailHeader({
  guest,
  canList,
  canEdit,
  groupHref,
}: {
  guest: GuestDetail;
  /** `guests: view` + `all`: the Guests list exists for this viewer. */
  canList: boolean;
  /** `guests: update`. */
  canEdit: boolean;
  /** Where a viewer without the list goes back to: the guest's group, when it can be opened. */
  groupHref: string | null;
}) {
  const t = useTranslations("GuestDetailHeader");
  const locale = useLocale() as Locale;
  const { id, name, firstVisitDate, currentGroup } = guest;
  const back = canList
    ? { href: "/guests", label: t("allGuests") }
    : groupHref && currentGroup
      ? {
          href: groupHref,
          label: t("backToGroup", { group: currentGroup.name }),
        }
      : null;
  const strong = (chunks: React.ReactNode) => (
    <strong className="font-semibold text-heading">{chunks}</strong>
  );

  return (
    <header className="mb-6 flex flex-col gap-6">
      <StaffAppBreadcrumbs
        items={[
          ...(canList ? [guestsBreadcrumb] : []),
          ...(!canList && groupHref && currentGroup
            ? [groupsBreadcrumb, { label: currentGroup.name, href: groupHref }]
            : []),
          { label: name, href: `/guests/${id}` },
        ]}
      />
      <div className="flex flex-wrap items-center gap-5">
        <InitialsAvatar
          className="bg-accent text-[22px] text-accent-foreground"
          name={name}
          size="xl"
        />
        <div className="flex flex-[1_1_280px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className={title({ size: "md" })}>{name}</h1>
            <GuestsBadge label={t("badge")} />
          </div>
          <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            {firstVisitDate && (
              <span>
                {t.rich("firstVisit", {
                  date: formatCalendarDate(firstVisitDate, locale),
                  strong,
                })}
              </span>
            )}
            <span>
              {currentGroup
                ? t.rich("inGroup", {
                    group: currentGroup.name,
                    strong,
                  })
                : t("noGroup")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {back && (
            <NextLink
              className={buttonVariants({
                variant: "outline",
                className: "gap-2 font-semibold text-heading",
              })}
              href={back.href}
            >
              <ArrowLeftIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
              {back.label}
            </NextLink>
          )}
          {canEdit && (
            <NextLink
              className={buttonVariants({
                variant: "primary",
                className: "gap-2",
              })}
              href={`/guests/${id}/edit`}
            >
              <PencilSquareIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
              {t("edit")}
            </NextLink>
          )}
        </div>
      </div>
    </header>
  );
}
