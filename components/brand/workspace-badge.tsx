import clsx from "clsx";

import { siteConfig, type Workspace } from "@/config/site";

type WorkspaceBadgeProps = {
  workspace?: Workspace;
  className?: string;
};

/**
 * "Workspace / Iglesia Petra" chip under the sidebar logo: an initial tile plus
 * a two-line label. Styled for the navy rail only (same in light and dark).
 *
 * This is the hook for per-church branding: today it falls back to the
 * hard-coded `siteConfig.workspace`; later the caller passes the signed-in
 * user's church (and the tile can become that church's logo).
 */
export const WorkspaceBadge = ({
  workspace = siteConfig.workspace,
  className,
}: WorkspaceBadgeProps) => (
  <div
    className={clsx(
      "flex items-center gap-2.5 rounded-tile bg-white/6 px-3 py-2.5",
      className,
    )}
  >
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-[13px] font-bold text-gold-300"
    >
      {workspace.initial}
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="text-[11px] tracking-[0.06em] text-muted-on-dark uppercase">
        Workspace
      </span>
      <span className="truncate text-sm font-semibold text-white">
        {workspace.name}
      </span>
    </span>
  </div>
);
