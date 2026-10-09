import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Breadcrumbs } from "@heroui/react";

export type StaffAppBreadcrumbItem = {
  label: string;
  href: string;
};

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
}: {
  items: StaffAppBreadcrumbItem[];
}) {
  return (
    <Breadcrumbs
      className={crumbClasses}
      separator={<ChevronRightIcon strokeWidth={2} />}
    >
      <Breadcrumbs.Item className="gap-2 pr-2" href="/">
        Dashboard
      </Breadcrumbs.Item>
      {items.map(({ href, label }) => (
        <Breadcrumbs.Item key={href} className="gap-2 pr-2" href={href}>
          {label}
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  );
}
