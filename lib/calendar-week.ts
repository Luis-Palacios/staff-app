const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written "YYYY-MM-DD". */
export function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * The Sunday–Saturday week around `date` ("YYYY-MM-DD"), in UTC so no time zone moves the day.
 * It is the church's week (reports rule 12): a report's week and its church Sunday agree.
 */
export function weekAround(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00Z`);

  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  // Copy after moving `start` back to Sunday, so a week that starts in the previous month ends
  // on the right day.
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
