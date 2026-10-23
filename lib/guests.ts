// Guest small groups (rules 12 and the "New" pill). Safe for client code.

/** A guest who missed this many reports in a row gets the stopped-coming suggestion (rule 12). */
export const GUEST_STOPPED_COMING_SUGGEST_AFTER = 3;

/** A guest shows "New" on Group detail for this many days after joining. */
export const GUEST_NEW_DAYS = 14;

/** Whether `joinedAt` is within the "New" window as of `today` (both "YYYY-MM-DD"). */
export function isNewGuest(joinedAt: string, today: string): boolean {
  const days =
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${joinedAt}T00:00:00Z`)) /
    86_400_000;

  return days < GUEST_NEW_DAYS;
}
