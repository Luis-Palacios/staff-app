import type { ComponentType, SVGProps } from "react";

import { HomeIcon } from "@heroicons/react/24/solid";
import { Breadcrumbs } from "@heroui/react";

export type StaffAppBreadcrumbItem = {
  label: string;
  href: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export function StaffAppBreadcrumbs({
  items,
}: {
  items: StaffAppBreadcrumbItem[];
}) {
  return (
    <Breadcrumbs className="mb-3">
      <Breadcrumbs.Item className="flex items-center gap-1.5" href="/">
        <HomeIcon className="h-4 w-4 mr-2" />
        <span>Home</span>
      </Breadcrumbs.Item>
      {items.map(({ href, icon: Icon, label }) => (
        <Breadcrumbs.Item
          key={href}
          className="flex items-center gap-1.5"
          href={href}
        >
          {Icon && <Icon className="h-4 w-4 mr-1" />}
          <span>{label}</span>
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  );
}
