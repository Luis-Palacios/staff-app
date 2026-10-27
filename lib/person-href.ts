/**
 * Where a tagged person's chip goes. Part 2 adds a Timeline tab, so a person's page will be
 * `/members/{id}/timeline` and `/guests/{id}/timeline`: that is the one line to change then.
 */
export function personHref(person: {
  type: "member" | "guest";
  id: number;
}): string {
  return person.type === "guest"
    ? `/guests/${person.id}`
    : `/members/${person.id}`;
}
