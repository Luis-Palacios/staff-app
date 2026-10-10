# Account menu redesign and language picker

Implementation spec for restyling the topbar's account menu and adding an
English/Spanish language picker to it. Do it in **two stages**, one commit each.
Each stage must pass `pnpm lint` and `pnpm exec tsc --noEmit` and be checked in
light and dark, at desktop width and below `sm` (640px), before the next one starts.

- **Approved design (source of truth for look):** Claude Design canvas
  https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1, artboard **"Account menu
  (shell)"** (`project/AccountMenu.dc.html`, read it with the Artifact tool's `read`
  and `path`). It shows the menu open in light/dark, desktop and phone. The blue
  sticky note next to it summarizes the spec below.
- **Files touched:** `components/topbar.tsx` (main), possibly
  `components/theme-switch.tsx` (only if `THEME_OPTIONS` needs a tweak), plus the
  new language files listed in Stage 2.
- **Out of scope:** real translations / i18n. Stage 2 only adds the picker and a
  stored locale preference that the future i18n work will read. No UI strings change
  language yet.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Account menu restyle | ✅ done | see `git log` |
| 2. Language picker (preference only) | [ ] | |

---

## Stage 1: account menu restyle

Today the popover (`Dropdown.Popover` in `components/topbar.tsx`) uses HeroUI's
default rounding, which looks too round, plus a weak "Signed in as" header, items
with no icons, and Logout with no separation. Rework it as below.

### Popover surface

- Reuse the existing "menus that sit on the page" tokens the church menu already
  uses (`components/brand/church-context.tsx`), so both menus match:
  `w-72 max-w-[calc(100vw-2rem)] rounded-[14px] border border-overlay-border shadow-overlay-menu`.
  The canvas draws 280px / 16px radius. Take the church menu's `w-72` / 14px so the
  two menus are identical. Don't add new tokens.
- `bg-surface` (white in light, navy-900 `#0B2341` in dark). The current dark popover
  is the lighter navy-800, which is the thing to fix.
- `placement="bottom end"` with an 8px offset from the trigger (`offset={8}` or the
  v3 equivalent; check the Popover docs/CSS in
  `node_modules/@heroui/styles/dist/components/`). It must not overlap the avatar.
- No inner padding on the popover itself. Each group pads itself (below).

### Header (replaces "Signed in as")

- Row: `flex items-center gap-3 px-4 pt-4 pb-3.5`.
- Avatar: 40px initials circle with the same colors as the trigger
  (`bg-navy-900 text-gold-500 dark:bg-gold-500 dark:text-navy-900`), 14px bold.
  Either add an `xl`/40px size to `InitialsAvatar` with a color override via
  `className`, or reuse the trigger's span. Use `initialsOf` from
  `components/initials-avatar.tsx` and drop the local `getInitials` in `topbar.tsx`
  (it's a duplicate).
- Text column (`min-w-0 flex-1`):
  - Line 1: name (`text-[14.5px] font-semibold text-heading truncate`) followed by
    a role pill: `StatusBadge tone="accent"` (small: 11.5px text is fine via
    `className`) with `ROLE_LABELS[currentUser.role]`.
  - Line 2: email (`text-[13px] text-muted truncate`).
- This header is not a menu item. Keep it outside `Dropdown.Menu`, as now.

### Groups and items

- The menu is split into groups. Every group has `border-t border-separator p-1.5`
  with `gap-0.5` between items. Use `Dropdown.Section` for groups.
- Item: `h-10 px-2.5 rounded-[10px] gap-2.5 text-sm font-medium text-heading`,
  leading 18px Heroicons **outline** icon in `text-muted` (`strokeWidth={1.8}`).
  Hover/focus background: `bg-surface-secondary`. Check how HeroUI's
  `dropdown`/`menu-item` CSS exposes hover/focus (data attributes or CSS vars) and
  hook into that rather than fighting selectors.
- Group order (desktop):
  1. **Language**: added in Stage 2 (skip in Stage 1).
  2. **My profile**: `UserCircleIcon`, label "My profile" (sentence case),
     `router.push("/users/me")` as today.
  3. **Sign out**: its own group. `ArrowRightStartOnRectangleIcon`, label
     "Sign out" (matches `/sign-in`). `variant="danger"`: text **and** icon in
     `text-danger`, hover background `bg-danger-soft`. Calls the existing
     `handleSignOut`.
- Below `sm`, the existing **Theme** section stays first. Restyle it to match:
  label "Theme" as `px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted`, items
  with sun/moon/system icons, and a `CheckIcon` (`text-accent`) on the selected one.
  This is the same behaviour as today, only restyled.

### Trigger while open

- While the menu is open the trigger keeps `bg-surface-secondary` (use the
  trigger's open/expanded data attribute) and the chevron rotates 180°
  (`transition-transform`), pointing up.

### Done when

- [x] Matches the canvas in light and dark, desktop and < `sm`.
- [x] Keyboard: open with Enter/Space, arrows move through items in every group,
      Esc closes and returns focus to the trigger.
- [x] Long email truncates with an ellipsis without widening the popover.
- [x] Lint and type-check clean.

Notes from the build: item classes live in a `tv()` `menuItem` (topbar.tsx) so
Sign out's danger colors *replace* the defaults (with `clsx` both stayed and
stylesheet order won). Pass the variant per slot call (`item({ danger: true })`):
slot functions from separate `menuItem()` calls share state.

---

## Stage 2: language picker (preference only)

**Decision:** the picker lives in the account menu, not the topbar. It's rarely
changed, and the browser default means most users never need it. The topbar is
already full below `lg`. A sign-in page switch may come later and is not part of
this plan.

### Behaviour

- Supported locales: `en`, `es`. Default: **`en`**.
- **Resolution order** (server-side, so the first render is right):
  1. `ekk_locale` cookie, if it holds a supported value.
  2. Otherwise the `Accept-Language` request header (that's how Chrome's language
     setting reaches the server): first entry whose primary subtag is `es` → `es`,
     else `en`. Respect q-values loosely: walk the list in order.
  3. Otherwise `en`.
- Choosing a language in the menu writes the cookie (1 year, `sameSite: "lax"`,
  `secure` in production, `path: "/"`) via a server action and refreshes, the same
  pattern as `app/(app)/_actions/switch-church.ts`. Validate the value server-side
  (a server action is a public endpoint).
- Until i18n lands, the only visible effect is the check moving and
  `<html lang>` changing. Set `lang` in `app/layout.tsx` from the resolved locale
  (it's hard-coded `"en"` today).
- Persisting to the user's profile on the auth-server is **future work**. Leave a
  `TODO(i18n)` where that would go, not a stub API call.

### Code layout (suggested; adjust to fit)

- `lib/locale.ts` (server-only, `cache()`d like `lib/workspace.ts`):
  `LOCALES = ["en", "es"] as const`, `type Locale`, `DEFAULT_LOCALE`,
  `LOCALE_COOKIE = "ekk_locale"`, `isLocale()`, `getLocale()` (the resolution order
  above), and `LOCALE_LABELS: Record<Locale, { label: string; tag: string }>` =
  `{ en: { label: "English", tag: "EN" }, es: { label: "Español", tag: "ES" } }`.
  Keep the constants and types in a file that client code can import without
  pulling in `next/headers`, e.g. `lib/locale-shared.ts`.
- `app/(app)/_actions/set-locale.ts`: `"use server"` action
  `setLocale(locale: string): Promise<{ ok: boolean }>`.
- Pass the resolved locale to the client. Either add it to `UserProvider`'s value or
  pass it as a `locale` prop through `AppShell` → `Topbar` (same route as `context`).
  Pick whichever touches less. Don't read the cookie on the client.

### UI (in the account menu)

- New `Dropdown.Section` **between the header and My profile**, at every screen
  size. Below `sm` it comes right **after** the Theme section.
- Section header row: `flex items-baseline justify-between`, left "Language"
  (`text-xs font-semibold text-muted`), right hint "Default: your browser"
  (`text-xs text-muted font-normal`).
- `selectionMode="single"`, `disallowEmptySelection`, `selectedKeys={[locale]}`,
  same `onSelectionChange` shape as the Theme section → call `setLocale`.
- Items: label in its own language ("English", "Español"). In place of an icon, a
  24×18 tag: `flex h-[18px] w-6 items-center justify-center rounded-[5px] border
  border-overlay-border text-[10px] font-bold tracking-[0.04em] text-muted`
  showing `EN` / `ES`. Selected item gets the same `CheckIcon` (`text-accent`) as
  Theme. Set `lang="es"` on the Español item's label so screen readers pronounce it.
- Optimistic: move the check immediately (`useOptimistic` or local state) and
  revert if the action returns `{ ok: false }`.

### Done when

- [ ] Fresh browser with Chrome set to Spanish → check on Español and `<html lang="es">`.
      English browser → English. No cookie is written until the user picks.
- [ ] Picking a language survives reload and sign-out/sign-in (cookie, not session).
- [ ] Invalid cookie value (e.g. `fr`) falls back to the header, then `en`.
- [ ] Works below `sm` (after Theme) and in both themes.
- [ ] Lint and type-check clean. Update `CLAUDE.md` (architecture: locale
      resolution + `lib/locale.ts`) and `docs/dashboard-layout.md` (menu contents).
