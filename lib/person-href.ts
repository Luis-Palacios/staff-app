/**
 * Where a tagged person's chip goes: their Timeline tab (rule 12), which is the page that shows
 * where they were tagged. The viewer's access to it is the person page's own.
 */
export function personHref(person: {
  type: "member" | "guest";
  id: number;
}): string {
  return person.type === "guest"
    ? `/guests/${person.id}/timeline`
    : `/members/${person.id}/timeline`;
}
