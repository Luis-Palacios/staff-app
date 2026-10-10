// Sections with detail pages (`/applications/[id]`). Add a section here when it
// gets one.
const sectionsWithDetailPages = ["/applications"];

/**
 * Where to go after switching church. A detail page shows a record of the old
 * church, so it goes back to its section's list (`/applications/167` →
 * `/applications`). Every other page stays put: its data simply reloads for
 * the new church.
 */
export function pathAfterChurchSwitch(pathname: string): string {
  const section = sectionsWithDetailPages.find((list) =>
    pathname.startsWith(`${list}/`),
  );

  return section ?? pathname;
}
