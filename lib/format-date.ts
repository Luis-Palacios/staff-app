function formatLocal(iso: string, options: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatLocalDateTime(iso: string): string {
  return formatLocal(iso, { dateStyle: "medium", timeStyle: "short" });
}

export function formatLocalDate(iso: string): string {
  return formatLocal(iso, { dateStyle: "medium" });
}

export function formatLocalTime(iso: string): string {
  return formatLocal(iso, { timeStyle: "short" });
}

// "Oct 8": compact date for list rows where the year is implied.
export function formatLocalShortDate(iso: string): string {
  return formatLocal(iso, { month: "short", day: "numeric" });
}

// "Thursday, October 9": today's date in the dashboard eyebrow.
export function formatLocalLongDate(iso: string): string {
  return formatLocal(iso, { weekday: "long", month: "long", day: "numeric" });
}
