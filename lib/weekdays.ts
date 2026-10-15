import type { Weekday } from "@/api/small-groups-api/types";

/** `Weekday` (ISO, 1 = Monday) to its key under the `Weekdays` messages. */
export const WEEKDAY_KEYS = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  7: "sunday",
} as const satisfies Record<Weekday, string>;
