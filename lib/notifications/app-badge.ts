// The installed app's icon badge (Badging API, notifications rule 17). Browsers and platforms
// without it, and pages that aren't an installed app, do nothing, and a refusal is never an error
// for the page.

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/** Shows `count` on the app icon, or clears the badge at 0. */
export function syncAppBadge(count: number): void {
  try {
    const nav = navigator as BadgeNavigator;
    const done = count > 0 ? nav.setAppBadge?.(count) : nav.clearAppBadge?.();

    done?.catch(() => {});
  } catch {
    // Not supported here, or called where there is no navigator.
  }
}
