/** "Ana, Luis and Rosa" / "Ana, Luis y Rosa": a list the way the picked language reads it. */
export function formatList(items: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(items);
}

/**
 * The same list as parts, so each name can be a link: `index` points into `items` for the
 * `element` parts; `literal` parts are the commas and the "and".
 */
export function formatListParts(
  items: readonly string[],
  locale: string,
): { type: "element" | "literal"; value: string; index: number }[] {
  let index = 0;

  return new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  })
    .formatToParts(items)
    .map((part) => ({
      type: part.type,
      value: part.value,
      index: part.type === "element" ? index++ : -1,
    }));
}
