import type { NavLabelKey } from "@/config/site";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Breadcrumbs } from "@heroui/react";
import { useTranslations } from "next-intl";

/** A page crumb names a `Nav` key and is translated here; a data crumb (an
 *  applicant's name, say) passes its text as is. */
export type StaffAppBreadcrumbItem = { href: string } & (
  | { labelKey: NavLabelKey }
  | { label: string }
);

// HeroUI renders the link and separator itself, so they're restyled from the
// root through their data-slot attributes. The last crumb is the current
// page: react-aria renders it as a non-link with aria-current="page" and
// HeroUI adds data-current, which the heading-colour rule keys on.
const crumbClasses = [
  "flex-wrap gap-y-1",
  "[&_[data-slot=link]]:text-[13.5px] [&_[data-slot=link]]:font-normal [&_[data-slot=link]]:text-muted",
  "[&_[data-slot=link][data-current=true]]:font-semibold [&_[data-slot=link][data-current=true]]:text-heading",
  "[&_[data-slot=breadcrumbs-separator]]:text-subtle",
].join(" ");

export function StaffAppBreadcrumbs({
  items,
  onNavigate,
}: {
  items: StaffAppBreadcrumbItem[];
  /** Takes over a plain click on a crumb (an editor that saves or asks before leaving). Clicks
   *  with a modifier key still open the link as usual. */
  onNavigate?: (href: string) => void;
}) {
  const t = useTranslations("Nav");
  const crumbs = (
    <Breadcrumbs
      className={crumbClasses}
      separator={<ChevronRightIcon strokeWidth={2} />}
    >
      <Breadcrumbs.Item className="gap-2 pr-2" href="/">
        {t("dashboard")}
      </Breadcrumbs.Item>
      {items.map((item) => (
        <Breadcrumbs.Item
          key={item.href}
          className="gap-2 pr-2"
          href={item.href}
        >
          {"labelKey" in item ? t(item.labelKey) : item.label}
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  );

  if (!onNavigate) return crumbs;

  return (
    // Capture runs before the link's own handler, so the click never navigates by itself.
    <div
      className="contents"
      onClickCapture={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const link = (event.target as Element).closest("a[href]");
        const href = link?.getAttribute("href");

        if (!href) return;

        event.preventDefault();
        event.stopPropagation();
        onNavigate(href);
      }}
    >
      {crumbs}
    </div>
  );
}
