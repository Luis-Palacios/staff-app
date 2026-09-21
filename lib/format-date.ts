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
