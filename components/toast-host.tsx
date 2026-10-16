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
) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
}

export function ToastHost() {
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: "success" | "danger";
  } | null>(null);

  useEffect(() => {
    function onToast(event: Event) {
      const { message, tone } = (
        event as CustomEvent<{
          message: string;
          tone: "success" | "danger";
        }>
      ).detail;

      setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
    }

    window.addEventListener(EVENT, onToast);

    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    toast && (
      <SavedToast key={toast.id} message={toast.message} tone={toast.tone} />
    )
  );
}
