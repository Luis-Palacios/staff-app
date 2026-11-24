// Service worker for Web Push (notifications spec, rules 17, 19, 21).
//
// It does two things: show a notification when a push arrives, and open the app when one is
// clicked. It deliberately has no `fetch` handler and no cache: signed-in pastoral data must never
// be served from a cache (rule 21). Do not add offline support here without a cache policy spec.
//
// The push message (JSON, made by auth-server):
//   { title, body, path, tag, notificationId: number | null, badgeCount }
// `title` and `body` are already in the recipient's language. `tag` is the delivery's idempotency
// key, so a duplicate replaces the notification already shown instead of stacking.

// Take over open pages as soon as a new version installs, so a fix to this file isn't held back
// behind an old tab. Nothing here caches, so there is nothing to migrate.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function readMessage(event) {
  try {
    return event.data ? event.data.json() : null;
  } catch {
    return null;
  }
}

self.addEventListener("push", (event) => {
  const message = readMessage(event);

  // A push without a title can't be shown, and browsers require every push to show something.
  // auth-server always sends one; fall back to the app name rather than showing nothing.
  const title = (message && message.title) || "ekklesiaio";
  const work = [
    self.registration.showNotification(title, {
      body: (message && message.body) || "",
      tag: (message && message.tag) || undefined,
      icon: "/icons/icon-192.png",
      // Android's status bar needs a single-colour silhouette.
      badge: "/icons/icon-monochrome-512.png",
      data: {
        path: message ? message.path : null,
        notificationId: message ? message.notificationId : null,
      },
    }),
  ];

  // The app icon badge (rule 17), where the platform has it. A push with no count leaves it alone.
  if (message && typeof message.badgeCount === "number") {
    const nav = self.navigator;

    if (message.badgeCount > 0 && nav.setAppBadge) {
      work.push(nav.setAppBadge(message.badgeCount).catch(() => {}));
    } else if (message.badgeCount === 0 && nav.clearAppBadge) {
      work.push(nav.clearAppBadge().catch(() => {}));
    }
  }

  event.waitUntil(Promise.all(work));
});

// Where a click goes: the in-app entry's opening route (it marks the entry read, rule 15), or the
// message's own path when there is no entry. Only a same-origin relative path is followed.
function targetUrl(data) {
  const home = new URL("/", self.location.origin);
  const id = data && data.notificationId;

  if (typeof id === "number" && Number.isInteger(id) && id > 0) {
    return new URL("/notifications/open/" + id, self.location.origin);
  }

  const path = data && data.path;

  if (typeof path !== "string" || !path.startsWith("/")) return home;

  // Parse, then check where it really points: URL parsing drops tabs and newlines and reads "\" as
  // "/", so a prefix check alone can be fooled ("/\t/evil.example" becomes https://evil.example/).
  try {
    const url = new URL(path, self.location.origin);

    return url.origin === self.location.origin ? url : home;
  } catch {
    return home;
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = targetUrl(event.notification.data);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const ours = windows.filter(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      // The tab the person last looked at, if any is focused or visible; else the first one.
      const open =
        ours.find((client) => client.focused) ||
        ours.find((client) => client.visibilityState === "visible") ||
        ours[0];

      if (!open) {
        await self.clients.openWindow(url.href);

        return;
      }

      // Focus first, while the click still allows it: browsers only let a worker focus or open a
      // window for a moment after the click (Firefox about 1 s), and navigate() waits for the page.
      let focused = open;

      try {
        focused = await open.focus();
      } catch {
        // Not allowed or the tab went away: navigating below still brings the page.
      }

      try {
        // navigate() only works on a page this worker controls; an uncontrolled one throws.
        await (focused || open).navigate(url.href);
      } catch {
        await self.clients.openWindow(url.href);
      }
    })(),
  );
});
