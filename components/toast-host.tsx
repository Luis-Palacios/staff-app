"use client";

import { useEffect, useState } from "react";

import { SavedToast } from "@/components/saved-toast";

const EVENT = "ekk:toast";

/**
 * A toast from a control that is about to leave the page (a row that stops being "not filed"
 * after a refresh), so the toast can't live inside it. `showToast` is called from the control and
 * `ToastHost`, mounted once in the shell, shows it. Messages arrive already translated.
 */
export function showToast(
  message: string,
  tone: "success" | "danger" = "success",
  /** A second, quieter line ("Check names and details before you share it."). */
  detail?: string,
) {
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { message, tone, detail } }),
  );
}

type Toast = {
  message: string;
  tone: "success" | "danger";
  detail?: string;
};

export function ToastHost() {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);

  useEffect(() => {
    function onToast(event: Event) {
      const toast = (event as CustomEvent<Toast>).detail;

      setToast((current) => ({ id: (current?.id ?? 0) + 1, ...toast }));
    }

    window.addEventListener(EVENT, onToast);

    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    toast && (
      <SavedToast
        key={toast.id}
        detail={toast.detail}
        message={toast.message}
        tone={toast.tone}
      />
    )
  );
}
