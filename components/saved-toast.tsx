"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

const VISIBLE_MS = 4000;

// "Member added" / "Changes saved" after a save redirects here with
// `?saved=…`. The param is dropped right away so a reload doesn't show the
// toast again; the toast itself disappears after a few seconds. The text
// arrives as a prop, so no client namespace is needed.
export function SavedToast({
  message,
  tone = "success",
}: {
  message: string;
  /** `danger` is for an action that failed (same bar, red icon). */
  tone?: "success" | "danger";
}) {
  const Icon = tone === "danger" ? ExclamationCircleIcon : CheckCircleIcon;

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.has("saved")) {
      url.searchParams.delete("saved");
      window.history.replaceState(window.history.state, "", url);
    }

    const timer = window.setTimeout(() => setVisible(false), VISIBLE_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-3rem)] items-center gap-2.5 rounded-xl bg-[#13325A] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-float)]"
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon
        aria-hidden="true"
        className={`size-5 shrink-0 ${tone === "danger" ? "text-[#FDA29B]" : "text-[#8EDDB4]"}`}
      />
      {message}
    </div>
  );
}
