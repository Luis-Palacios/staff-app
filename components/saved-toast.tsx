"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

const VISIBLE_MS = 4000;

// "Member added" / "Changes saved" after a save redirects here with
// `?saved=…`. The param is dropped right away with `history.replaceState`
// (Next keeps its router in sync with it), so a reload doesn't show the toast
// again; the toast itself disappears after a few seconds. `router.replace`
// would refetch the page without the param and unmount the toast at once.
// The text arrives as a prop, so no client namespace is needed.
export function SavedToast({
  message,
  detail,
  tone = "success",
}: {
  message: string;
  /** An optional second, quieter line under the message. */
  detail?: string;
  /** `danger` is for an action that failed (same bar, red icon); `warning` for one that half worked. */
  tone?: "success" | "danger" | "warning";
}) {
  const Icon = {
    danger: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    success: CheckCircleIcon,
  }[tone];

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has("saved")) {
      params.delete("saved");

      const query = params.toString();

      window.history.replaceState(
        null,
        "",
        query
          ? `${window.location.pathname}?${query}`
          : window.location.pathname,
      );
    }

    const timer = window.setTimeout(() => setVisible(false), VISIBLE_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 flex w-max max-w-[calc(100vw-3rem)] -translate-x-1/2 ${detail ? "items-start" : "items-center"} gap-2.5 rounded-xl bg-navy-800 px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-float)]`}
      role={tone === "success" ? "status" : "alert"}
    >
      <Icon
        aria-hidden="true"
        className={`size-5 shrink-0 ${
          {
            danger: "text-danger-on-dark",
            // The toast is navy in both themes, so the brand gold reads on it.
            warning: "text-gold-500",
            success: "text-success-on-dark",
          }[tone]
        }`}
      />
      {detail ? (
        <span className="flex flex-col gap-0.5">
          {message}
          <span className="text-[13.5px] font-normal leading-[1.45] text-on-dark">
            {detail}
          </span>
        </span>
      ) : (
        message
      )}
    </div>
  );
}
