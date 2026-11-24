"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` once from the signed-in shell, so a push can arrive and be clicked (rule 21).
 * It asks for nothing: permission and the subscription happen only after a tap on *Turn on* in My
 * profile (rule 19). Browsers without service workers do nothing.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Private windows and some policies refuse; the device row then reads as not turned on.
      });
  }, []);

  return null;
}
