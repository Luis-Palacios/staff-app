// The text *Copy for WhatsApp* puts on the clipboard (prayer & follow-up rule 13, report tags rule
// 17): WhatsApp markup (`*bold*`) in plain text, one line per item starting with `• `, tagged people
// as plain first names (no `@`, no last names). Titles and dates arrive already in the viewer's
// language. No leader names, no links.
// Pure, so they're easy to read and to unit-test later.

export interface WhatsAppEntry {
  group: string;
  /** The short meeting date the entry shows ("Tue, Oct 13"). */
  date: string;
  /** One entry per item, tagged people already as first names. */
  items: string[];
}

/** `• ` and the item, one line each. */
function itemLines(items: readonly string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

/** One entry: `*Prayer requests · Mujeres de Fe* (Tue, Oct 13)`, a newline, a `• ` line per item. */
export function whatsappEntryText(
  sectionTitle: string,
  { group, date, items }: WhatsAppEntry,
): string {
  return `*${sectionTitle} · ${group}* (${date})\n${itemLines(items)}`;
}

/**
 * Copy all: `*Prayer requests · Oct 11 – 17*`, a blank line, then `*Group* (date)` and a `• ` line
 * per item for each entry, the entries separated by blank lines.
 */
export function whatsappAllText(
  sectionTitle: string,
  weekRange: string,
  entries: WhatsAppEntry[],
): string {
  const blocks = entries.map(
    ({ group, date, items }) => `*${group}* (${date})\n${itemLines(items)}`,
  );

  return [`*${sectionTitle} · ${weekRange}*`, ...blocks].join("\n\n");
}
