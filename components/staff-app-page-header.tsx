import type { ReactNode } from "react";

import { subtitle, title } from "@/components/primitives";
import {
  StaffAppBreadcrumbs,
  type StaffAppBreadcrumbItem,
} from "@/components/staff-app-breadcrumbs";

// Breadcrumbs are optional because the dashboard (the breadcrumb root) has
// none. Actions sit to the right of the title and wrap below it on mobile.
// `breadcrumbAside` sits at the right of the breadcrumb row (a report's save
// status); `titleAside` next to the title (a status pill).
export function StaffAppPageHeader({
  breadcrumbs,
  breadcrumbAside,
  eyebrow,
  title: heading,
  titleAside,
  description,
  actions,
}: {
  breadcrumbs?: StaffAppBreadcrumbItem[];
  breadcrumbAside?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  titleAside?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-6">
      {breadcrumbAside ? (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {breadcrumbs && <StaffAppBreadcrumbs items={breadcrumbs} />}
          {breadcrumbAside}
        </div>
      ) : (
        breadcrumbs && <StaffAppBreadcrumbs items={breadcrumbs} />
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[640px] flex-col gap-1.5">
          {eyebrow && (
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-eyebrow">
              {eyebrow}
            </p>
          )}
          {titleAside ? (
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
              <h1 className={title({ size: "md" })}>{heading}</h1>
              {titleAside}
            </div>
          ) : (
            <h1 className={title({ size: "md" })}>{heading}</h1>
          )}
          {description && <p className={subtitle()}>{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}
