# Brand restyle: ekklesiaio look for the staff app

Implementation spec for applying the approved ekklesiaio brand to the staff app.
Work through it **stage by stage**. Each stage should be one reviewable change that
lints, type-checks and works in light and dark before the next one starts.

- **Approved design (source of truth for look):** Claude Design canvas
  https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1. It has a token sheet, Dashboard,
  Applications list, Application detail and Sign in, each in light and dark, plus the
  Sidebar and Topbar on their own.
- **Brand source:** `../landing-page/brand/theme.css` and `../landing-page/public/brand/*.svg`.
- **Out of scope:** Groups and report-submission screens (designed in a later session), and
  per-church branding (later; see the "workspace" slot in Stage 2).

## Progress (handoff log)

Work happens on the **`brand-restyle`** branch, **one commit per stage**. The branch was
rebased onto `main`, which already has Stage 1 (`def9ed2`), so merging is conflict-free.

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Tokens, fonts, theme mapping | ✅ done | `def9ed2` |
| 2. Logo and workspace slot | ✅ done | `617e604` |
| 3. Shell (sidebar, topbar, theme switch) | ✅ done | `9ec18db` + focus-halo fix `a65e71a` |
| 4. Shared page patterns | ✅ done | `e10e57e` + follow-ups `3efb0fe`, `f31e120` |
| 5. Dashboard | ✅ done | `7d6a7e6` + follow-up `181868a` |
| 6. Applications list | ✅ done | `347ea35` + follow-up (see `git log`) |
| 7. Application detail | ✅ done | see `git log` |
| 8. Auth screens | ✅ done | see `git log` |
| 9. Users and invites | ✅ done | see `git log` |

**All nine stages are done.** Remaining follow-ups are listed under Stage 9 below. Read the canvas artboards first (the Artifact tool's `read` with
`path: "project/<Name>.dc.html"`: `Dashboard`, `Applications`, `ApplicationDetail`,
`SignIn`, `Sidebar`, `Topbar`). They hold exact px values and colors, so you don't have
to guess them.

### Decisions and deviations so far (already in the code)

- **Brand components** live in `components/brand/`:
  - `EkklesiaioMark` and `EkklesiaioLogo` take `tone: "on-dark" | "on-light" | "auto"`.
    `auto` is an addition to this spec: it keeps the one allowed `dark:` swap inside the
    component.
  - `WorkspaceBadge` reads `siteConfig.workspace`, or a `workspace` prop for per-church
    branding later.
  - The old PETRA `Logo` was deleted; recover it from `def9ed2` (Stage 1, the last commit that has it).
- **Inter** loads as the variable font (no `weight` list), so the wordmark's 650 weight
  renders exactly.
- **Segmented-control tokens:** `--segment`, `--segment-selected` and `--segment-shadow`
  (`bg-segment`, `bg-segment-selected`, `shadow-segment`) in `globals.css`. The track and
  the selected pill swap surfaces between modes. **Reuse them for the Stage 6 status
  filter.**
- **Restyling HeroUI components:** first read their CSS in
  `node_modules/@heroui/styles/dist/components/<name>.css`.
  - Many expose CSS variables, e.g. `--toggle-button-*`. Set those with Tailwind
    arbitrary properties rather than overriding their selectors (see
    `components/theme-switch.tsx`).
  - `InputGroup.Prefix` and `InputGroup.Suffix` draw divider borders; remove them with
    `border-0`.
- **Focus halo:**
  - The global `:focus-visible` halo is scoped to
    `:where(a, button:not([data-slot]), summary)`. Applied to every element, it also hit
    focused HeroUI menus and showed a stray gold line.
  - HeroUI components draw their own ring from `--focus`.
  - On the navy rail, the sidebar redefines both `--focus` and `--shadow-focus` to
    gold-500. Do the same for any other navy panel, such as the Stage 8 sign-in brand
    panel.
- **Sidebar footer version** comes from `NEXT_PUBLIC_APP_VERSION`, set in
  `next.config.mjs` from `npm_package_version`.
- **Nav icons:** Heroicons outline at stroke 1.6 through `iconRegistry`
  (`NavIconName` = `dashboard | groups | applications | access`). `components/icons.tsx`
  now only holds `MenuIcon`, `CloseIcon` and an unused `ChevronDownIcon` (the detail
  page uses Heroicons' outline chevron).
- **Topbar:**
  - Side padding is `px-4 lg:px-8`.
  - Below `sm` the search field collapses behind an icon button and opens on its own row.
  - The account avatar is a plain `<span>`, not HeroUI `Avatar`, so its colors are exact.
- **Stage 4 shared pieces (reuse these in Stages 5–9):**
  - `StaffAppPageHeader({ breadcrumbs?, eyebrow?, title, description?, actions? })`.
    Breadcrumbs are optional (the dashboard has none); the first crumb is always
    "Dashboard". Crumb items no longer take an `icon`.
  - `title({ size })` / `subtitle()` / `card()` in `components/primitives.ts`.
  - `StatusBadge` (`components/status-badge.tsx`) and `ApplicationStatusBadge`
    (`applications/_components`). Neutral is `bg-default text-muted`, so roles read
    differently from the accent (Admin) badge in light mode, where the spec's navy-soft
    neutral looked the same as accent.
  - `InitialsAvatar` (`sm` 36 / `md` 38 / `lg` 64) and `initialsOf()`.
  - `components/data-table.tsx`: `dataTable()` slot classes for HeroUI `Table` with
    `variant="secondary"`, plus `DataTablePrimaryCell`, `DataTableOpenLink` and
    `DataTableFooter` (pagination is visual-only, TODO until the APIs page).
  - `EmptyState` (`components/empty-state.tsx`), `LocalTime`.
- **`--subtle` is a light/dark token now** (`#8D9AAB` / `#5E7391`), moved out of
  `brand.css`. Decorative only (chevrons, separators); never text.
- **Applications table already has the Stage 6 columns** (Person, Application, Submitted,
  Fulfilled, Status, Open). Stage 6 still owns the status filter, the search input, the
  page title/description and the mobile cards. "Not yet" is `text-muted`, not the
  canvas's subtle grey, which fails text contrast.
- **Table keyboard focus:** react-aria's grid moves focus to the row (arrow keys move
  between cells), and HeroUI draws a gold ring around the focused row. Links inside
  cells aren't separate Tab stops; that's react-aria's grid pattern, not a bug.
- **Page titles** are 30px below `sm` and 38px from `sm` up (`title({ size: "md" })`), so
  long titles don't wrap on phones. To restyle a title at another size, start from `sm`
  (as `EmptyState` does): overriding `md` with a bare `text-*` leaves its `sm:text-[38px]`.
- **Stage 5 dashboard** (`app/(app)/page.tsx` + `app/(app)/_components/`):
  - The page starts every fetch at once without awaiting and passes the promises down.
    Each section awaits its own inside a `Suspense`, and sections that need the same data
    share one promise (tile 2 and the recent card share `getRecentApplications()`; tile 3
    and the attention card share `listUsers`).
  - **Failures stay in their section.** Every dashboard fetch goes through `settle()`
    (`lib/settle.ts`), which returns `{ ok: false }` instead of rejecting and logs the
    error on the server; `mapSettled()` derives counts from it. A failed tile shows "—" +
    "Couldn't load"; the cards show a one-line `text-danger` error. Use the same helper
    for any page that shows several independent sources.
  - Stat tiles: the link and its frame show at once; the body (number, sub-label, tone)
    suspends. `attention` tiles ("Awaiting fulfilment", "Waiting for a role") use the
    warning tone only while their count is above 0. Two columns below `sm`, `p-4`.
  - Errors render `ErrorState` (`components/error-state.tsx`): an `EmptyState` (new
    `action` slot, `as="h1"`) with a "Try again" primary button. Page errors hit
    `app/(app)/error.tsx`, which keeps the shell; `app/error.tsx` only catches the
    `(app)` layout itself (session lookup) and centers the card on a bare page.
  - "Recent" is the API's **60-day** window, counted back from the newest application
    (`DEFAULT_RECENT_WINDOW` in membership-applications), not the canvas's 30 days.
    Labels say "Last 60 days".
  - The subtitle follows the spec ("…this week."), not the canvas's "…at Iglesia Petra
    this week."
  - "Awaiting fulfilment" links to `/applications?status=pending`.
  - The greeting and date eyebrow fill in after mount (browser clock and locale), like
    `LocalFormattedDate`. `LocalShortDate` ("Oct 8") is new in `components/`.
  - **Focus on `card()` links:** `card()`'s shadow utilities beat the global halo (a
    base-layer rule), so a link styled as a card restates it with
    `focus-visible:shadow-[var(--shadow-focus)] dark:focus-visible:shadow-[var(--shadow-focus)]`
    (the `dark:` copy is needed to beat `dark:shadow-none`). Rows inside an
    `overflow-hidden` card use an inset ring instead, since the halo would be clipped.

- **Stage 6 applications list** (`applications/_components/applications-browser.tsx`):
  - The API takes no filter parameters, so the status and text filters both run in the
    browser over the fetched list. Segment counts follow the text filter.
  - `?status=pending|fulfilled` is written with `window.history.replaceState`, not
    `router.replace`: Next keeps `useSearchParams` in sync with it, and it doesn't
    refetch the page from the server on every click.
  - The text filter matches the name (case- and accent-insensitive, so "maria" finds
    "María") or the application number, with or without `#`.
  - **"Last 90 days" is left out**: the API has no date-range parameter, and "recent"
    is a fixed 60-day window.
  - `StatusFilter` reuses the `--segment` tokens like `ThemeSwitch`. The selected label
    is `text-heading` and its count pill is `bg-accent`. Unselected pills are
    `bg-border text-foreground` (the canvas's dark-mode pill is navy-800; `border` is
    the closest token).
  - **`card({ interactive: true })`** is for a card that is itself a link (stat tiles,
    mobile application cards): hover border plus the restated focus halo.
  - An `aria-live` line announces the result count when a filter changes.
  - `DataTableFooter` renders nothing when `total` is 0; the table's empty state says it.

- **Stage 7 application detail** (`applications/[id]/` + `components/person_timeline`):
  - `ApplicationDetailHeader` replaces `StaffAppPageHeader` (no avatar slot there) but
    reuses `StaffAppBreadcrumbs`. A pending application's meta line ends "Not fulfilled
    yet" instead of a Fulfilled date.
  - `DetailCardHeading` (eyebrow + `title({ size: "sm" })`) tops both cards.
  - Accordion triggers get `data-[focus-visible=true]:ring-inset`: HeroUI's ring sits
    outside the trigger and the card's `overflow-hidden` clipped it.
  - Testimony bodies use `whitespace-pre-line` so typed line breaks survive. **No
    `lang`**: the API doesn't say which language a testimony is in.
  - **`--marker-ring` token** (gold-100 light, gold-500/22 dark → `ring-marker-ring`)
    for the gold current marker, instead of a `dark:` override.
  - Heroicons has no water drop, so baptism uses a custom `DropIcon`
    (`person_timeline/icons.tsx`) drawn in the outline style. The old FontAwesome-style
    `ChildReachingIcon` / `PersonWaterIcon` are gone.
  - Sub-line per event = the event's own name when it differs from its type (the API
    has no description field). "First visit" is a display label for the
    "First Assistance" key.

- **Stage 8 auth screens** (`app/(auth)/`):
  - `layout.tsx` is the two-panel frame; below `md` the brand panel is a logo-only bar
    (`flex-col md:flex-row`, not the canvas's wrap). The panel redefines `--focus` and
    `--shadow-focus` to gold like the sidebar. The Privacy link is
    `siteConfig.links.privacy` (`https://ekklesiaio.com/privacy`; the landing page picks
    `/en/` or `/es/`).
  - Shared pieces in `(auth)/_components/`: `AuthHeading` (h1 + muted line),
    `AuthTextField` (46px field, 14px semibold label, optional `description`),
    `PasswordField` (same sizing, new `labelAction` slot for "Forgot password?") and
    `auth-styles.ts` (`authStack` 22px column, `authButton` 48px with `rounded-control`,
    `authFooterLine`).
  - **`textLink()`** in `primitives.ts`: navy/gold-300 text with a gold underline. The
    dashboard's "View all" uses it too.
  - **Buttons:** HeroUI's default is a pill; the canvas uses 10px corners, so
    `authButton` adds `rounded-control`. App-shell buttons ("Invite staff", "All
    applications") are still pills: decide in Stage 9 whether to switch them globally.
  - Buttons that only navigate (reset's "Request a new link", the invite's "Create
    account" / "Sign in") are now `NextLink`s styled with `buttonVariants`.
  - Signed-in users are redirected away from sign-in, sign-up and forgot-password by
    `proxy.ts`. To view the frame while signed in, use `/reset-password?token=x` (form)
    or `/reset-password` (invalid-link state).
  - Copy: sign-up's description is now "Set up your staff account to get started.",
    and it gained an "Already have an account? Sign in" line.

- **Stage 9 users and invites** (`app/(app)/users/**`):
  - Both tables use `dataTable()` + `DataTableFooter`; `DataTablePrimaryCell`'s `href`
    is now optional (users and invites have no detail page). Users: Person (name +
    email) · Role · Status · Joined. Invites: Invitee (email + "Invited by") · Role
    (badge, like users) · Status · Sent · Cancel.
  - Mobile cards are `<article>`s (not links, since there's nowhere to go) built on
    `card()`, with the role picker or Cancel inside.
  - `InviteStaffLink` (`users/_components`) is the shared header action on the
    dashboard and the users page.
  - New-invite form is a `card()` with "Send an invite", labels above 40px fields (the
    role select gained a visible label), and a real `<form>` so Enter submits.
  - `AssignPendingRole` is 34px to match row actions and has an `aria-label` (it had no
    label before). HeroUI's `Select.Trigger` doesn't center its value; add
    `items-center` when you change its height.
  - Cancel is a danger outline: `smallOutlineButton` (now exported from
    `data-table.tsx`) + danger text/border + `--button-bg-hover: var(--danger-soft)`.
  - `/users/me` is still a stub; nothing to restyle yet.

### Gotchas

- **Stale CSS in dev.** If brand colors or fonts don't show after CSS changes, Turbopack
  is serving cached CSS. You can tell from the served CSS: it still has
  `--font-sans: "font"` or `--accent: #0485f7`. Stop `pnpm dev`, run
  `Remove-Item -Recurse -Force .next`, and restart. Touching the files does not help.
- **Restart after editing `next.config.mjs`.** The dev server restarts when it changes and
  may not come back up on its own.
- **Width checks in the automation browser.** The window may not resize. Check 1024 and
  390 by loading the app in same-origin iframes of those widths instead.
- **Keyboard checks in the automation browser.** Synthetic Tab presses don't move focus.
  Use `el.focus({ focusVisible: true })` in a script and read the computed `box-shadow`.
- **`tailwind-variants` merges classes with `tailwind-merge`.** A `text-*` size drops
  any `leading-*` before it (font sizes set their own line height), so put the leading
  after the size, as `title()` does.
- **Old-palette grep:** no real hits left after Stage 7. `text-warning-soft-foreground`
  hits are false positives.

## Principles (read before every stage)

1. **Colors go through HeroUI's variables.** HeroUI v3 reads every color from CSS variables
   (`--background`, `--surface`, `--accent`, `--muted`, …) and Tailwind exposes them as
   theme-aware utilities (`bg-surface`, `text-muted`, `bg-accent`, `border-border`). Use
   those in components, so one class works in both modes.
2. **Raw brand palette only for mode-independent things.** `bg-navy-900`, `text-gold-500`
   and similar are for elements that look the same in both modes: the sidebar rail, the logo,
   the sign-in brand panel. Never use them for page content.
3. **Gold never carries text on a light background.** Use the `--warning-soft-foreground`
   / gold-800/900 values for gold-ish text in light mode.
4. **Status = dot + word**, never color alone.
5. **No component-level `dark:` overrides** unless a token can't express it. If you need
   one, it probably means a token is missing; add the token instead.

## Stage 1: Tokens, fonts and theme mapping ✅

**Files:** `styles/brand.css` (new), `styles/globals.css`, `config/fonts.ts`,
`app/layout.tsx`, `config/site.ts`.

### 1a. `styles/brand.css`: a filtered copy of the brand theme

Copy `../landing-page/brand/theme.css` to `styles/brand.css` and **delete these four
lines**, because they collide with names HeroUI already registers as theme-aware utilities
(`@heroui/styles/dist/themes/shared/theme.css` maps `--color-muted: var(--muted)` etc.):

- `--color-muted`
- `--color-surface`
- `--color-danger`
- `--color-field` (and keep `--color-field-disabled` only if renamed to `--color-field-muted`)

Keep everything else: navy/gold scales, `ink`, `subtle`, `on-dark`, `line*`, `paper`,
`danger-on-dark`, the font stacks, display sizes, radii and shadows. Add a header comment
saying it is a filtered copy and why. Add the dark-mode extras used by the design to the
palette:

```css
--color-navy-700: #1A3D69;  /* surface-tertiary on dark */
--color-line-on-dark: #1F3B60;
--color-muted-on-dark: #93A3B8;
--color-heading-on-dark: #F4F6F9;
```

### 1b. `styles/globals.css`: import order and HeroUI variable mapping

```css
@import "tailwindcss";
@import "@heroui/styles";
@import "./brand.css";

@custom-variant dark (&:is(.dark *));
```

Remove the template's `@theme { --font-sans: "font", …; --font-mono: … }` block (brand.css
now defines `--font-sans` / `--font-display`; keep a `--font-mono` line only if something
uses it).

Replace the current `@layer base { :root { … } }` with this. It must come **after** the
HeroUI import so it wins:

```css
@layer base {
  :root,
  [data-theme="light"] {
    --container-lg: 80rem;

    --background: #FBFAF7;            /* paper */
    --foreground: #33445A;            /* ink: body text */
    --surface: #FFFFFF;
    --surface-secondary: #F1F4F8;     /* navy-50 */
    --surface-tertiary: #EAF0F7;      /* navy-100 */
    --overlay: #FFFFFF;
    --muted: #56667A;
    --default: #F1F4F8;
    --default-foreground: #0B2341;
    --accent: #0B2341;                /* navy: primary buttons, selection */
    --accent-foreground: #FFFFFF;
    --focus: #8A5B00;                 /* gold-800: plain gold-500 is ~1.7:1 on paper, fails WCAG 1.4.11 */
    --shadow-focus: 0 0 0 2px var(--background), 0 0 0 4px var(--focus);
    --link: #0B2341;
    --border: #E2E5EA;
    --separator: #EEF0F3;

    --field-background: #FFFFFF;
    --field-foreground: #0B2341;
    --field-border: #C9D0DA;
    --field-border-width: 1px;
    --field-placeholder: #56667A;

    --success: #1F8A55;
    --success-foreground: #FFFFFF;
    --warning: #F2B544;
    --warning-foreground: #0B2341;
    --danger: #B42318;
    --danger-foreground: #FFFFFF;

    /* soft (badge) pairs: set explicitly, HeroUI's color-mix derivations fail contrast */
    --success-soft: #E3F2EA;
    --success-soft-foreground: #1E6B45;
    --warning-soft: #FDF1D8;           /* gold-100 */
    --warning-soft-foreground: #7A5100;/* gold-900 */
    --danger-soft: #FDECEA;
    --danger-soft-foreground: #B42318;
    --accent-soft: #EAF0F7;
    --accent-soft-foreground: #0B2341;

    --heading: #0B2341;                /* custom: page/card titles */
    --eyebrow: #8A5B00;                /* custom: gold-800 eyebrow text */
    --rail: #0B2341;                   /* custom: sidebar, same in both modes */
    --rail-edge: #0B2341;

    --radius: 0.625rem;                /* 10px controls */
    --field-radius: 0.625rem;
  }

  .dark,
  [data-theme="dark"] {
    --background: #081A31;            /* navy-950 */
    --foreground: #C3CDDA;            /* on-dark */
    --surface: #0B2341;               /* navy-900 */
    --surface-secondary: #13325A;     /* navy-800 */
    --surface-tertiary: #1A3D69;
    --overlay: #13325A;
    --muted: #93A3B8;
    --default: #13325A;
    --default-foreground: #F4F6F9;
    --accent: #F2B544;                /* gold: primary buttons, selection */
    --accent-foreground: #0B2341;
    --focus: #F2B544;
    --link: #F7D48F;
    --border: #1F3B60;
    --separator: #173052;

    --field-background: #0B2341;
    --field-foreground: #F4F6F9;
    --field-border: #2E4A70;
    --field-placeholder: #93A3B8;

    --success: #8EDDB4;
    --success-foreground: #0B2341;
    --warning: #F2B544;
    --warning-foreground: #0B2341;
    --danger: #FDA29B;
    --danger-foreground: #0B2341;

    --success-soft: rgb(142 221 180 / 0.12);
    --success-soft-foreground: #8EDDB4;
    --warning-soft: rgb(242 181 68 / 0.14);
    --warning-soft-foreground: #F7D48F;
    --danger-soft: rgb(253 162 155 / 0.12);
    --danger-soft-foreground: #FDA29B;
    --accent-soft: #13325A;
    --accent-soft-foreground: #F7D48F;

    --heading: #F4F6F9;
    --eyebrow: #F2B544;
    --rail: #0B2341;
    --rail-edge: #1F3B60;
  }
}

@theme inline {
  --color-heading: var(--heading);
  --color-eyebrow: var(--eyebrow);
  --color-rail: var(--rail);
  --color-rail-edge: var(--rail-edge);
}
```

Also add a global focus style so non-HeroUI elements (plain links, our badges) get the gold
halo: `:focus-visible { outline: none; box-shadow: var(--shadow-focus); }`. Check HeroUI's
own components still look right; scope it to `a, button:not([data-slot])` if they double up.

### 1c. Fonts: `config/fonts.ts`

Replace Inter/Fira Code with the brand trio (same variable names the landing page uses):

```ts
import { Figtree, Inter, Newsreader } from "next/font/google";

export const fontSans = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
export const fontDisplay = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
});
export const fontLogo = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["600", "700"] });
```

In `app/layout.tsx` put all three `.variable`s on `<body>` (body already has `font-sans`).

### 1d. Metadata and small fixes

- `app/layout.tsx`: `viewport.themeColor` → light `#FBFAF7`, dark `#081A31`.
- `config/site.ts`: `name: "ekklesiaio"` (title template becomes "Users - ekklesiaio");
  delete the HeroUI template `links` block if nothing references it (grep first).
- Favicon: copy `../landing-page/public/brand/icon.svg` to `app/icon.svg` (Next serves it
  automatically) and remove the `icons` entry pointing at `/favicon.ico`, or delete the old ico.
- Update CLAUDE.md's "defaults to `dark`" line to say `system` (that's what the code does).

**Done when:** the app already looks mostly on-brand in both modes with no component
edits. Buttons are navy (light) or gold (dark), fields have visible borders, the page is
paper or navy-950, and Figtree is the body font.

## Stage 2: Logo and workspace slot ✅

**Files:** `components/brand/ekklesiaio-logo.tsx` (new), `components/brand/workspace-badge.tsx`
(new), `components/icons.tsx`, every `Logo` usage (`sidebar.tsx`, `topbar.tsx`,
`app/(auth)/layout.tsx`, `app/(app)/loading.tsx`).

- `EkklesiaioMark`: inline SVG of the mark (paths from `landing-page/public/brand/icon.svg`,
  no background rect, `viewBox="6 6 88 88"`). Props: `size`, `tone: "on-dark" | "on-light"`.
  On-dark is white strokes + gold cross; on-light is navy strokes + gold cross. Decorative
  (`aria-hidden`).
- `EkklesiaioLogo`: mark + wordmark as **live text**, `font-logo` (Inter) weight 650,
  letter-spacing ≈ -0.037em, "ekklesia" in white/navy and "io" in gold-500. Wrap it in an
  element with `aria-label="ekklesiaio"`. Props: `size` (wordmark px), `tone`.
- `WorkspaceBadge`: the "Workspace / Iglesia Petra" chip under the sidebar logo (initial
  tile + two-line label). For now it reads a hard-coded `siteConfig.workspace = { name:
  "Iglesia Petra", initial: "P" }`. **This is the hook for per-church branding later.**
  Leave a short comment saying so.
- Remove the old PETRA `Logo` from `components/icons.tsx` (it stays in git history; note the
  commit hash in the PR description so it's easy to recover for per-church branding).
- Auth layout and `loading.tsx` should use the mark only (`tone` follows the theme, so read
  it with a `dark:` class swap or pass both and hide one; the mark is the one place a
  `dark:` switch is fine).

## Stage 3: Shell (sidebar, topbar, theme switch) ✅

Match the canvas's **Sidebar** and **Topbar** artboards.

**Sidebar (`components/sidebar.tsx`):**
- `bg-rail border-r border-rail-edge`, text `text-on-dark` (#C3CDDA), width stays `w-64`.
- Header: `EkklesiaioLogo tone="on-dark"` (≈21px wordmark, 30px mark), left-aligned,
  `px-5 pt-5 pb-4`, then `WorkspaceBadge` (`bg-white/6 rounded-tile mx-3.5 mb-3.5`).
- Items: `min-h-[42px] rounded-[10px] px-3 gap-3 text-[14.5px]`. Icon `size-5`, color
  `muted-on-dark` at rest.
  - **Active leaf:** `bg-navy-800 text-white font-semibold`, **icon gold-500**.
  - **Hover:** `bg-white/5 text-white`.
  - **Group with active child:** icon gold-500 (label stays on-dark).
  - **Children:** `ml-[22px] pl-3.5 border-l border-white/12`. An active child is
    `bg-gold-500/14 text-gold-300 font-semibold`.
- Switch the nav icons to Heroicons **outline** 24 (`squares-2x2`, `user-group`,
  `document-text`, `shield-check`) at stroke 1.6, replacing the custom ones in `icons.tsx`
  (delete the unused ones).
- Footer: `text-xs text-muted-on-dark px-5 pb-5`, "Staff app · v{version}" (or omit).
- Mobile off-canvas behavior unchanged.

**Topbar (`components/topbar.tsx`):**
- `bg-background/88 backdrop-blur border-b border-border px-8 py-3.5 min-h-[72px]`.
- Search field: `max-w-[520px] h-[42px]`, placeholder "Search people, applications…",
  `Ctrl K` kbd (show ⌘ on macOS if you detect it; otherwise "Ctrl").
- Theme switch: segmented control (`bg-surface-secondary` track, selected =
  `bg-surface shadow-sm text-heading` in light, `bg-surface-secondary text-accent` in dark),
  using Heroicons outline `sun` / `moon` / `computer-desktop` at 16px. Keep `aria-label`s.
- Account button: avatar + name + role (`text-xs text-muted`) + chevron. The avatar is navy
  with gold initials in light mode and gold with navy initials in dark mode:
  `bg-navy-900 text-gold-500 dark:bg-gold-500 dark:text-navy-900`. This is one of the few
  justified `dark:` switches, because `--accent-foreground` is white in light mode, not
  gold. Hide name and role below `md`. The role label comes from `ROLE_LABELS`.
- Mobile: hamburger + `EkklesiaioMark` stay; hide the search field below `sm` behind a
  search icon button.

## Stage 4: Shared page patterns

**Files:** `components/staff-app-page-header.tsx`, `components/staff-app-breadcrumbs.tsx`,
`components/primitives.ts`, `components/status-badge.tsx` (new), `components/data-table.ts`
(new, class helpers) or equivalent.

- **Breadcrumbs:** no Home icon. The first crumb is "Dashboard". Crumbs are `text-[13.5px]
  text-muted` with chevron-right separators (`text-subtle`), and the current page is
  `text-heading font-semibold` with `aria-current="page"`.
- **Page header:** `StaffAppPageHeader({ breadcrumbs, eyebrow?, title, description?, actions? })`.
  Title is `<h1>` in `font-display font-medium text-[38px] leading-[1.1] tracking-[-0.015em]
  text-heading`. Eyebrow is `text-[13px] font-semibold uppercase tracking-[0.08em]
  text-eyebrow`. Description is `text-base text-muted`. Actions sit right-aligned and wrap
  below on mobile.
- **`primitives.ts`:** delete the gradient color variants. `title()` becomes the display
  heading above (sizes `sm` 24px card title / `md` 38px page / `lg` 48px) and `subtitle()`
  becomes muted body text.
- **`StatusBadge`:** `<StatusBadge tone="success|warning|danger|neutral|accent" variant="solid-dot|ring-dot">Label</StatusBadge>`,
  a pill `inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-0.5 text-[12.5px]
  font-semibold bg-{tone}-soft text-{tone}-soft-foreground` with a 7px dot (solid for done or
  active states, hollow ring for pending or waiting). Replace `Chip` in:
  - applications status: Fulfilled = success/solid, Pending = warning/ring (labels change
    from Yes/No);
  - `user-status-chips.tsx`: Active = success, Unverified = warning/ring, Banned = danger;
  - `invite-status-chips.tsx`: Pending = warning/ring, Accepted = success, Expired =
    warning, Rejected = danger, Canceled = neutral;
  - `role-display.ts`: roles = `neutral` (navy-soft), Admin = `accent`, Pending = warning/ring.
    Update the comments that explain the old Chip color constraint.
- **Cards:** `rounded-card` (16px), `border border-border bg-surface`, light-only shadow
  `shadow-[0_1px_2px_rgb(11_35_65/0.05)] dark:shadow-none`. Card titles use `title({size:"sm"})`.
- **Tables:** keep HeroUI `Table` and restyle via its slot classes (check the v3 Table docs
  and `@heroui/styles/dist/components` for slot names; don't guess). The target:
  - left-aligned everywhere (drop the `text-center` on every column);
  - header row `bg-surface-secondary/50`, `text-xs font-semibold uppercase tracking-[0.06em]
    text-muted`;
  - rows `border-t border-separator`, 12px vertical padding, `tabular-nums`;
  - primary cell = 36px initials avatar (`bg-accent-soft text-accent-soft-foreground`) +
    name (`font-semibold text-heading`, links to the detail page) + a muted secondary line;
  - row action = small bordered "Open ›" link-button at the right;
  - footer = "Showing X–Y of Z" + Previous/Next (pagination can be visual-only until the
    API paginates; say so in a TODO).
- **Empty state:** dashed `border-field` card, 44px `bg-accent-soft` icon tile, display-font
  title, muted one-line body. Make it a component (`components/empty-state.tsx`); Groups and
  Reports stubs use it now.
- **Skeletons:** update `table-skeleton` and `card-skeleton` to the new radii and spacing.

## Stage 5: Dashboard (`app/(app)/page.tsx`)

Match the **Dashboard** artboards. **Use only data the app already fetches.** Don't invent
endpoints.

- Header: eyebrow = today's date (user's locale, `LocalDate`-style client component), title
  "Good morning/afternoon/evening, <first name>" (the name part italic 400), and the subtitle
  "Here's what needs your attention this week." Primary action "Invite staff" → `/users/invites`,
  **admin/elder only** (`STAFF_ADMIN_ROLES`).
- Stat tiles (responsive grid, `minmax(210px,1fr)`). Each tile is a link with an icon tile,
  a display-font number and a label + muted sub-label:
  1. New applications: `getRecentApplicationsCount()`, links to `/applications`.
  2. Awaiting fulfilment: count of `getRecentApplications()` where `!isFulfilled`.
  3. Waiting for a role: `listUsers` where `role === "pending"`. Admin/elder only.
  4. Open invites: `listInvites` with derived status `pending`. Admin/elder only.
  Non-admins see tiles 1–2 only. Fetch in parallel; each tile gets its own `Suspense` +
  skeleton so a slow service doesn't block the page.
- Recent applications card (two-thirds width): the five most recent, each row = avatar,
  name, "Application #id · Submitted <date>", status badge and chevron, linking to the detail
  page. Header link "View all" (navy text, gold underline).
- Right column: "Needs your attention" (pending-role users with an **Assign role** button
  reusing `AssignPendingRole`, plus an "N invites haven't been accepted yet" row → invites;
  admin/elder only; hide the card if both are empty) and the Groups **empty state**.
- Layout: `flex flex-wrap gap-5`, main card `flex-[2_1_560px]`, side column `flex-[1_1_320px]`.

## Stage 6: Applications list

Match the **Applications** artboards.

- Page header: title "Membership applications"; description "Testimonies from people
  preparing to become members. Open one to read it and see their journey so far."
- Toolbar: segmented status filter **All / Pending / Fulfilled** with counts (client-side
  filter over the fetched list, kept in the URL as `?status=`), a filter input "Name or
  application #" (client-side), and a "Last 90 days" button only if the API supports a range
  (otherwise leave it out).
- Table columns: **Person** (avatar + name + "Person #id") · **Application** (#id) ·
  **Submitted** (date + muted time on a second line) · **Fulfilled** (date, or muted "Not
  yet") · **Status** (badge) · action.
- Mobile cards (`md:hidden`): same data. Avatar + name + badge on the first row, "#id ·
  Submitted date" muted, and the full card is the link.
- Remove the `inline-block text-center` wrapper around the table.

## Stage 7: Application detail (`app/(app)/applications/[id]/page.tsx`)

Match the **Application detail** artboards.

- Header row: 64px avatar (`bg-accent text-accent-foreground`), name as `<h1>` with the
  status badge beside it, and a meta line "Application **#id** · Person **#id** · Submitted
  **date** · Fulfilled **date**". The right-aligned secondary button "← All applications"
  replaces the "Application from: X" title.
- Two columns, `flex flex-wrap gap-5`: testimony `flex-[3_1_520px]`, timeline `flex-[2_1_340px]`.
- **Testimony card:** eyebrow "Testimony", title "In their own words". Keep the HeroUI
  Accordion (all three expanded by default now) and restyle each trigger: a numbered 26px
  `bg-accent-soft` circle + `text-base font-semibold text-heading` + chevron. Body text in
  **`font-display text-[17.5px] leading-[1.65] max-w-[66ch]`**, indented to align with the
  title. Add `lang` on the body if the person's language is known (testimonies are usually
  Spanish).
- **Timeline card** (`components/person_timeline`): eyebrow "Journey", title "Timeline".
  Earlier markers are `bg-accent-soft text-accent-soft-foreground` with a `ring-4 ring-surface`;
  the **current (latest) marker is gold** (`bg-gold-500 text-navy-900`, ring
  `gold-100` light / `gold-500/22` dark). The connector is 2px `bg-separator`. Use Heroicons
  outline for the icons. Show "First visit" instead of "First Assistance" as a display label
  only (keep the data key); add a sub-line per event ("Completed course", "Baptized", …)
  only if the API provides one, otherwise just the name and date.

## Stage 8: Auth screens

Match the **Sign in** artboards. `app/(auth)/layout.tsx` becomes a two-panel layout, so
sign-up, forgot/reset password, needs-verification, needs-role and accept-invite all
inherit it.

- **Brand panel** (`flex-[1_1_420px] bg-navy-900 text-on-dark px-12 py-10`, same in both
  modes, with `border-r border-rail-edge`): `EkklesiaioLogo tone="on-dark"` at the top. A
  vertically centered block with the eyebrow "Staff workspace" (gold-500), headline "Know
  your people. *Care for them well.*" (display 44px, white, second sentence italic
  gold-300) and the paragraph "Membership applications, groups and the people behind them,
  all in one place for your church's staff." The footer reads "© {year} ekklesiaio ·
  Privacy" (Privacy links to https://ekklesiaio.com privacy page).
  **Below `md` the panel collapses** to a compact bar with only the logo.
- **Form side:** `flex-[1_1_520px]`, centered, `max-w-[420px]`, **no Card wrapper**.
  - Title: `<h1>` "Sign in" (display 38px). Description: "Use the email your church
    invited you with."
  - Fields: 46px tall with 14px semibold labels. "Forgot password?" sits on the right of
    the Password label row.
  - Button: full-width primary, 48px.
  - Sign-up line: centered and muted, with a navy/gold-underlined link.
- Apply the same frame to the other auth pages (title + description + form, no Card).

## Stage 9: Users and invites (pattern pass)

No new design here. Apply Stage 4's header, table, badge and card patterns to
`app/(app)/users/**` and `app/(app)/users/invites/**`, including the mobile card variants,
the new-invite form (fields 40px, labels above, primary "Send invite"), and the
cancel-invite button (danger outline). Replace `window.confirm` for admin invites with a
HeroUI `AlertDialog` while you're there, as a separate commit.

## Checks for every stage

```powershell
pnpm lint; pnpm exec tsc --noEmit
```

Then on http://localhost:3001 check:
- **Light, Dark and System** via the topbar switch.
- **Widths:** 1440, 1024 (sidebar collapses below `lg`), 390.
- **Keyboard:** Tab through the page and confirm the gold focus halo shows on every
  control.
- **Contrast:** spot-check muted text on `surface-secondary` in dark mode (≥ 4.5:1).
- **Nothing still uses the old palette:**
  `rg "text-warning|text-accent decoration-accent|bg-accent text-accent-foreground" app components`.

When a stage is done, write a short summary of what changed and anything that differs
from the canvas, so it can be reviewed before the next stage.
