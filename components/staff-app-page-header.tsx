import type { ReactNode } from "react";

import { subtitle, title } from "@/components/primitives";
import {
  StaffAppBreadcrumbs,
  type StaffAppBreadcrumbItem,
} from "@/components/staff-app-breadcrumbs";

// Breadcrumbs are optional because the dashboard (the breadcrumb root) has
// none. Actions sit to the right of the title and wrap below it on mobile.
export function StaffAppPageHeader({
  breadcrumbs,
  eyebrow,
  title: heading,
  description,
  actions,
}: {
  breadcrumbs?: StaffAppBreadcrumbItem[];
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-6">
      {breadcrumbs && <StaffAppBreadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[640px] flex-col gap-1.5">
          {eyebrow && (
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-eyebrow">
              {eyebrow}
            </p>
          )}
          <h1 className={title({ size: "md" })}>{heading}</h1>
          {description && <p className={subtitle()}>{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}
