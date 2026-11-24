"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether `query` matches. `false` on the server and during hydration, so a dialog that opens
 * from a tap always renders after the width is known.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const list = window.matchMedia(query);

      list.addEventListener("change", callback);

      return () => list.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
