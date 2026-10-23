// The text *Copy for WhatsApp* puts on the clipboard (rule 13): WhatsApp markup (`*bold*`) in
// plain text. Titles and dates arrive already in the viewer's language. No leader names, no links.
// Pure, so they're easy to read and to unit-test later.

export interface WhatsAppEntry {
  group: string;
  /** The short meeting date the entry shows ("Tue, Oct 13"). */
  date: string;
  text: string;
}

/** One entry: `*Prayer requests · Mujeres de Fe* (Tue, Oct 13)`, a newline, the text. */
export function whatsappEntryText(
  sectionTitle: string,
  { group, date, text }: WhatsAppEntry,
): string {
  return `*${sectionTitle} · ${group}* (${date})\n${text}`;
}

/**
 * Copy all: `*Prayer requests · Oct 11 – 17*`, a blank line, then `*Group* (date)` and the text
 * per entry, the entries separated by blank lines.
 */
export function whatsappAllText(
  sectionTitle: string,
  weekRange: string,
  entries: WhatsAppEntry[],
): string {
  const blocks = entries.map(
    ({ group, date, text }) => `*${group}* (${date})\n${text}`,
  );

  return [`*${sectionTitle} · ${weekRange}*`, ...blocks].join("\n\n");
}
