# Ministry › church context in the shell

Implementation spec for showing **which ministry and which church** the staff app is working
in. Today that's one hard-coded "Workspace / Iglesia Petra" chip under the sidebar logo. The
real structure is:

```
Ministry (e.g. Ministerio Cristiano Petra)
  ├─ Church 1 (e.g. Petra Managua)
  ├─ Church 2
  └─ Church n
```

A session always works in **exactly one church**. The shell shows the ministry name and the
church name, and lets a user switch church when they have access to more than one.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`church-context`** branch. Each stage must lint, type-check and work in light and dark,
at 1440 / 1024 / 390, before the next one starts. After each stage, write a short summary
of what changed and anything that differs from the canvas, so it can be reviewed.

- **Approved design (source of truth for look):**
  - Claude Design canvas "ekklesiaio · Ministry and church context"
    https://claude.ai/artifact/Y9MohigNJcYSRpnqpCBvjG. Artboards: `Main` (the sidebar card,
    recommended option B), `OptionB-Menu` (church menu open, light), `OptionB-Menu-Dark`,
    `OptionB-Phone` (topbar below `lg`). `OptionA` and `OptionC` are rejected alternatives:
    don't build them.
  - The staff-app canvas https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1 has the updated
    `Sidebar` artboard (same card as `Main` above).
  - Read artboards with the Artifact tool's `read` and `path: "project/<Name>.dc.html"`. They
    hold exact px values and colors.
- **Brand rules:** unchanged. Read `docs/BRAND-RESTYLE.md` → *Principles* before every stage
  (theme tokens for page content, raw navy/gold only on the rail, gold never carries text
  on a light background, focus is the gold halo, no new component-level `dark:` overrides).
- **Placeholder data:** the canvas shows "Petra Masaya" and "Petra León" in the menu. They
  are illustration only; don't put them in committed config.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Data seam and sidebar card | ⬜ | |
| 2. Church menu (switching) | ⬜ | |
| 3. Context below `lg` + docs | ⬜ | |

### Decisions and deviations

_(Fill in as stages land, like BRAND-RESTYLE.md.)_

## Why this design (short)

- "Workspace" is replaced by the **ministry name**, as a muted line above the **church
  name** (bold). Sentence case, not the old uppercase eyebrow: "MINISTERIO CRISTIANO PETRA"
  in 11px caps gets cut to "MINISTERIO CRISTIA…" in a 248px rail (see `OptionA`).
- The ministry line may wrap to **2 lines** (then clamps); the church line is one line
  with an ellipsis. Both carry the full text in a `title`.
- The card becomes a **switcher button** (chevron-up-down) only when there is more than one
  church to switch to. With one church it stays a static, non-focusable label.
- The context lives in the sidebar, next to the brand, the same pattern as team switchers
  in Linear/Vercel/Slack. The topbar stays for search, theme and account (`OptionC`
  crowded it). Below `lg` the sidebar is hidden, so the church name moves into the topbar.

## Stage 1: Data seam and sidebar card

**Files:** `config/site.ts`, `lib/workspace.ts` (new), `app/(app)/layout.tsx`,
`components/app-shell.tsx`, `components/sidebar.tsx`,
`components/brand/workspace-badge.tsx` → `components/brand/church-context.tsx` (rename).

### 1a. Types and config (`config/site.ts`)

Replace `Workspace` with:

```ts
export type Ministry = {
  id: string;
  name: string;
  /** Fallback for the tile when there is no logo. */
  initial: string;
  /** Square/circular mark shown in a 32px circle. Optional: ministries upload
   *  their own later; without one the tile shows `initial`. */
  logoUrl?: string;
};

export type Church = {
  id: string;
  name: string;
};

/** What the shell shows: the ministry, the church this session works in, and the
 *  churches the user may switch to (always includes `church`). */
export type ChurchContext = {
  ministry: Ministry;
  church: Church;
  churches: Church[];
};
```

and the hard-coded data (still the only source until multi-tenancy exists):

```ts
ministry: {
  id: "petra",
  name: "Ministerio Cristiano Petra",
  initial: "P",
  logoUrl: "/ministries/petra-mark.png",
},
churches: [{ id: "petra-managua", name: "Petra Managua" }],
```

Keep ids as opaque strings (they'll become DB ids). Don't add a "current church" to config;
the current church is per-session state (Stage 2).

### 1b. The seam (`lib/workspace.ts`, server-only)

```ts
import "server-only";

export async function getChurchContext(): Promise<ChurchContext>
```

- Stage 1: returns the config ministry, `churches`, and `church = churches[0]`.
- It is `async` on purpose: later it reads the session / auth-server and nothing that calls
  it has to change. **No component may read `siteConfig.ministry` or
  `siteConfig.churches` directly**; everything goes through this function.
- Wrap it in React `cache()` so the layout and any page that needs it share one call per
  request.
- If `server-only` isn't installed, add it (`pnpm add server-only`).

### 1c. Plumbing

- `app/(app)/layout.tsx`: after the session checks, `const context = await
  getChurchContext()` and pass it to `<AppShell context={context}>`.
- `AppShell` passes it to `Sidebar` (and to `Topbar` in Stage 3). Plain props, no new
  React context: two consumers don't justify a provider.

### 1d. `ChurchContextCard` (rename of `WorkspaceBadge`)

Match the `Main` artboard. Navy rail only, so raw palette is allowed here (Principle 2).

- Wrapper: `mx-3.5 mb-3.5 flex items-center gap-2.5 rounded-tile bg-white/6 py-2.5 pr-2.5
  pl-3`.
- Tile, 32px, decorative (the names are right beside it):
  - **With `logoUrl`:** `next/image` (`width={32} height={32}`, `alt=""`), `size-8
    rounded-full`, with a 1.5px white ring (`ring-[1.5px] ring-white`) so the logo's navy
    lower half doesn't melt into the rail. The asset is `public/ministries/petra-mark.png`
    (256px PNG, already in the repo): the mountain from the Petra logo, cropped to a circle
    with the wordmark and book removed, because text is unreadable at 32px.
  - **Without:** the letter tile, `size-8 rounded-full bg-navy-800 text-gold-300 text-sm
    font-bold`, showing `ministry.initial`, `aria-hidden`. Same circle shape so both
    variants line up.
  - Make it a small `MinistryMark` component (`size` prop) in `components/brand/`; Stage 2
    reuses it at 28px in the menu header.
- Text column `flex min-w-0 flex-1 flex-col gap-0.5`:
  - Ministry: `text-xs leading-[1.3] font-medium text-muted-on-dark line-clamp-2`.
  - Church: `text-sm leading-[1.3] font-semibold text-white truncate`.
  - `title` on each with the full name.
- No "Workspace" label any more.
- **Stage 1 renders it static** (a `<div>`, no chevron) regardless of the number of
  churches. Stage 2 adds the button.
- Keep the comment that this is the hook for per-church/ministry branding (the tile becomes
  the ministry's logo later).

### 1e. Clean-ups

- `grep -rn "WorkspaceBadge\|siteConfig.workspace\|Iglesia Petra"` across `app`,
  `components`, `config`, `lib`, `docs`, `CLAUDE.md`: update every hit.
- The dashboard subtitle stays church-free ("…this week."), as decided in Stage 5 of the
  brand restyle.

**Done when:** the rail shows the "P" tile, "Ministerio Cristiano Petra" (wrapping to two
lines at 248px) and "Petra Managua" in both modes, at 1440 and inside the mobile
off-canvas sidebar, and nothing reads the config directly except `lib/workspace.ts`.

## Stage 2: Church menu (switching)

**Files:** `components/brand/church-context.tsx`, `lib/workspace.ts`,
`app/(app)/_actions/switch-church.ts` (new, server action).

### 2a. Persisting the selection

- Cookie **`ekk_church`** = church id. `httpOnly`, `sameSite: "lax"`, `secure` in
  production, `path: "/"`, `maxAge` one year (it's a preference, not a credential).
- `getChurchContext()` reads the cookie and uses it **only if** that id is in `churches`.
  Otherwise (missing, stale, tampered) it falls back to `churches[0]`. Never trust the
  cookie for access: when churches come from the auth-server, `churches` will already be
  the list this user may see.
- Server action `switchChurch(churchId: string)`: validate against
  `getChurchContext().churches` (reject unknown ids), set the cookie, then
  `revalidatePath("/", "layout")`. The client calls `router.refresh()` after it resolves.
- After a switch, stay on the same URL **unless** it's a detail page (`/applications/[id]`):
  those records belong to the old church, so go to the section's list
  (`/applications`). Put that rule in one small helper with a comment.

### 2b. The menu

Match `OptionB-Menu` and `OptionB-Menu-Dark`.

- Use HeroUI v3 `Dropdown` the same way the topbar's account menu does
  (`components/topbar.tsx`). Check `node_modules/@heroui/react` for the selection API
  (single selection + selected key) before writing it; don't assume v2 props.
- **Trigger** (only when `churches.length > 1`): the whole card becomes a `<button>`
  (via `Dropdown.Trigger`), adds the Heroicons outline `ChevronUpDownIcon` (16px,
  `text-muted-on-dark`, stroke 1.8) at the right, hover `bg-white/10`, and the open state
  keeps `bg-white/10`. The rail's gold focus halo already applies.
- **Popover:** placement bottom-start, 6px offset, width 288px, `rounded-[14px]`, `p-1.5`,
  background `--overlay` (white / navy-800), border `border-border` in light and
  `field-border` in dark (see artboard). If that needs a `dark:` class, add a token
  instead (`--overlay-border`). Shadow: light `0 12px 32px rgb(11 35 65/0.16), 0 2px 6px
  rgb(11 35 65/0.08)`, dark `0 12px 32px rgb(0 0 0/0.45)`; again a token
  (`--shadow-overlay`) rather than `dark:`.
- **Header** (not selectable): `MinistryMark size={28}` with a 1px `border` ring instead
  of the white one (white disappears on the light overlay),
  ministry name `text-[13.5px] font-semibold text-heading`, "N churches" `text-[12.5px]
  text-muted`. Then a 1px `bg-separator` divider.
- **Items:** one per church, `min-h-11` (44px touch target), `px-3 rounded-[10px]
  text-sm`. Current church: `bg-surface-tertiary` (navy-100 light, navy-700 dark; light
  is one step stronger than the artboard's navy-50, accepted so one token works in both
  modes), `font-semibold text-heading`, and a 18px Heroicons `CheckIcon` (stroke 2) in
  `text-accent`. Others: `font-medium text-foreground`, hover `bg-surface-tertiary/60`.
  Don't use `bg-default` / `bg-surface-secondary` for hover: in dark mode they equal the
  overlay (navy-800) and the hover disappears.
- Selecting the current church just closes the menu. Selecting another: close, show a
  pending state on the trigger (the church line at 60% opacity is enough) while the action
  runs, then refresh.
- Accessibility: the trigger's accessible name must include both names (visible text
  does it; don't override with an `aria-label` that drops them). Items are
  `menuitemradio` with `aria-checked`, which HeroUI gives you with single selection.
  Escape closes and returns focus to the trigger.
- More than 8 churches: out of scope; note a TODO for a filter field.

### 2c. Testing it locally

Production config has one church, so the menu never shows. To test, **temporarily** add a
second church to `config/site.ts`; don't commit it. Check: the cookie is set, the label
changes after refresh, a hand-edited cookie with an unknown id falls back to the first
church, and a detail page redirects to its list.

**Done when:** with one church the card is static (no chevron, not focusable); with two or
more it opens the menu, switching persists across reloads, and light, dark, keyboard and
the 390px off-canvas sidebar all work.

## Stage 3: Context below `lg` and docs

**Files:** `components/topbar.tsx`, `CLAUDE.md`, `docs/dashboard-layout.md`,
`docs/BRAND-RESTYLE.md` (Stage 2 notes).

### 3a. Topbar label below `lg`

Match `OptionB-Phone`. Below `lg` the sidebar is off-canvas, so nothing says which church
you're in.

- After the hamburger and mark, add a context label, `lg:hidden`: a 1px `border-border`
  divider on its left (`ml-1 pl-2.5 border-l`), ministry `text-[11.5px] text-muted
  truncate`, church `text-[14.5px] font-semibold text-heading truncate`. It takes the
  remaining width (`min-w-0 flex-1`).
- It is **text, not a control**: switching happens from the sidebar card, which is one tap
  away behind the hamburger. One switcher, one place.
- At 390 it must fit beside the hamburger, mark, search icon button and avatar without
  wrapping; that's why both lines truncate.
- Make the hamburger and search icon buttons 44×44 if they aren't already (touch targets).

### 3b. Docs

- `CLAUDE.md`: replace the `WorkspaceBadge` mentions with `ChurchContextCard` and add one
  line on `getChurchContext()` being the only way to read the ministry/church.
- `docs/dashboard-layout.md`: its "Removed on purpose" list says the company/workspace
  dropdown was removed. Add a note that a church switcher came back in a different form,
  pointing here.
- `docs/BRAND-RESTYLE.md` → Decisions: one line saying `WorkspaceBadge` became
  `ChurchContextCard` (see this doc).
- Fill in this doc's progress table and *Decisions and deviations*.

**Done when:** at 390 and 1024 the topbar shows ministry and church without wrapping, in
both modes, and the docs no longer mention `WorkspaceBadge` or "Workspace".

## Later (not in these stages)

- **Real tenancy:** ministry and churches come from the auth-server per user; the church
  id travels in the JWT or a header to `membership-applications`, and FastAPI scopes
  queries by it. Until then switching changes the label only, which is why the menu only
  appears with more than one configured church.
- **Client caches:** when data is church-scoped, include the church id in every TanStack
  Query key (or clear the cache on switch) so one church's data never shows under another.
- Logo upload per ministry (the `logoUrl` field is ready for it); per-church logos; users who belong to more than one ministry (the menu
  would get one section per ministry).

## Checks for every stage

```powershell
pnpm lint; pnpm exec tsc --noEmit
```

Then on http://localhost:3001: Light, Dark and System; widths 1440, 1024, 390; Tab through
the sidebar card (and menu in Stage 2) and confirm the gold halo; the ministry line wraps
to two lines at most and the church line truncates (try a long name temporarily).
See BRAND-RESTYLE.md → *Gotchas* for stale CSS and automation-browser tips.
