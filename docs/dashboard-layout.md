# Dashboard layout — notes & porting guide

> **Styling note (2026-10):** the shell's *look* has since been restyled to the
> ekklesiaio brand (navy rail, Heroicons outline nav, segmented theme switch,
> account menu). See `docs/BRAND-RESTYLE.md` (Stage 3) for the current visuals.
> The structure, data model and responsive behaviour described here still apply;
> the table below is the historical record of the first pass.

This app's shell (sidebar + top bar) was reworked to resemble the
[`Siumauricio/nextui-dashboard-template`](https://github.com/Siumauricio/nextui-dashboard-template)
dark dashboard. That template targets **NextUI v2**; this repo is on **HeroUI v3
+ Tailwind v4**, so nothing was copied verbatim — the patterns were re-built with
the components we actually have. This doc records what was done and what is left,
so future work can pull more pieces from that template without re-deriving all of
this.

## What was built in this pass

| Piece | File | Notes |
| --- | --- | --- |
| App shell (holds mobile sidebar open/close state, body scroll lock) | `components/app-shell.tsx` | `"use client"`. Renders `<Sidebar>` + `<Topbar>` + `<main>`. Replaces the old single `<Navbar>`. |
| Left sidebar with right border, per-item icons, active state, collapsible groups | `components/sidebar.tsx` | `"use client"`. Desktop: `lg:sticky` rail, `w-64`, `border-r border-separator`. Mobile: fixed, `-translate-x-full`, slides in on `isOpen`, dark backdrop. |
| Top bar with wide search + right cluster | `components/topbar.tsx` | `"use client"`. Search is `flex-1 max-w-[520px]`, collapsed behind an icon button below `sm`. Right cluster = theme switch, account menu (avatar + name + role). Hamburger + brand mark show `lg:hidden`. |
| Nav data model with nesting | `config/site.ts` | `navItems: NavItem[]`; `NavItem` has `icon`, optional `href` (leaf) OR optional `items` (collapsible group). `navMenuItems` was deleted — the sidebar drives both desktop and mobile now. |
| Nav / chrome icons | `@heroicons/react/24/outline` + `components/icons.tsx` | Nav icons are Heroicons outline, mapped in `iconRegistry` (`components/sidebar.tsx`). `components/icons.tsx` keeps only `ChevronDownIcon`, `MenuIcon`, `CloseIcon`. |
| ~~`Balances` nested example + stub routes~~ | ~~`app/balances/*`~~ | Since removed; `Groups` and `Access` are the live collapsible-group examples. |
| Root layout wiring | `app/layout.tsx` | Now just `<Providers><AppShell>{children}</AppShell></Providers>`. The old `container mx-auto max-w-7xl` main + empty footer are gone; `<main>` inside `AppShell` keeps `max-w-7xl` centering. |

### Removed on purpose (per the request)

- **Company / workspace dropdown** in the sidebar header — replaced with just the
  logo + app name (`components/sidebar/companies-dropdown.tsx` in the template).
- **"Main Menu" / "General" / "Updates" section headers** — the template's
  `sidebar-menu.tsx`. We keep a single flat list; grouping is expressed by
  *collapsible* items instead.
- **Filter icon** and **settings cog** in the sidebar footer (template
  `sidebar.tsx` footer).

## How the sidebar reads its data

`config/site.ts`:

```ts
navItems: [
  { label: "Dashboard", icon: "dashboard", href: "/" },        // leaf
  {
    label: "Groups", icon: "groups",                            // collapsible group
    items: [
      { label: "List", href: "/groups" },
      { label: "Reports", href: "/groups/reports" },
    ],
  },
]
```

- **Add a top-level link:** add an object with `label`, `icon`, `href`.
- **Add a nested menu:** give the item `items: [...]` instead of `href`.
- **Add an icon:** add the key to `NavIconName` in `config/site.ts` and map it
  to a Heroicons **outline** (`@heroicons/react/24/outline`) component in
  `iconRegistry` in `components/sidebar.tsx`. (An item's `icon` can also be an
  icon component directly.)
- **Active state:** leaves and parents use prefix matching
  (`/groups` is active on `/groups/123`); nested children use exact matching so
  `/groups` and `/groups/reports` don't both light up. A group auto-
  expands (`defaultExpanded`) when one of its children is the current route.

Collapsible groups use HeroUI's `Disclosure` (`Disclosure.Trigger` /
`Disclosure.Content` / `Disclosure.Body` / `Disclosure.Indicator`). The indicator
auto-rotates on `data-expanded` — no manual chevron state needed.

## Responsive behaviour

- `< lg` (1024px): sidebar is `position: fixed` and translated off-canvas.
  The top-bar hamburger sets `isSidebarOpen` in `AppShell`; the sidebar slides in
  and a `lg:hidden` backdrop covers the page. Any nav click, the close button, or
  a backdrop click calls `onNavigate` → closes it. `AppShell` sets
  `document.body.style.overflow = "hidden"` while open.
- `>= lg`: sidebar is `lg:sticky lg:translate-x-0` and always visible; hamburger,
  mobile logo and backdrop are hidden.
- Search is `flex-1` capped at `max-w-[520px]`. Below `sm` it is hidden behind a
  search icon button that opens it on its own row. Account name/role hide below `md`.

> Verified: `pnpm build` + `npx tsc --noEmit` pass, no console errors, desktop
> render matches the target. The mobile breakpoint was **not** screenshot-tested
> (the automation browser window would not shrink below ~1536px CSS px); the
> markup follows the same Tailwind translate/backdrop pattern as the template.

## Component mapping — template (NextUI v2) → this repo (HeroUI v3)

| Template | HeroUI v3 equivalent | Status |
| --- | --- | --- |
| `Accordion` / `AccordionItem` (collapse-items) | `Disclosure` (`components/disclosure`) or `Accordion` / `DisclosureGroup` for single-open behaviour | done via `Disclosure` |
| `Navbar` (`@nextui-org/react`) | plain `<header>` + `TextField`/`InputGroup` | done |
| `Input` search | `TextField` + `InputGroup.Prefix/Input/Suffix` (already used); `SearchField` also exists (`components/search-field`) with a built-in clear button | done (TextField) |
| `Avatar` | `Avatar` + `Avatar.Image` / `Avatar.Fallback` (`components/avatar`) | done (fallback only) |
| `Dropdown` (companies) | `Dropdown` (`components/dropdown`) / `Menu` | omitted |
| `Tooltip` | `Tooltip` (`components/tooltip`) | not needed yet |
| `useLockedBody` hook | manual `body.style.overflow` in `AppShell` | done |
| `Link` (`next/link` wrapper) | `next/link` directly, or HeroUI `Link` (`components/link`) | using `next/link` |

## Not ported yet — content widgets (grab from the template when needed)

These are the dashboard *body* pieces from the screenshot. None are built here;
the main area is still the section stubs.

| Widget | Template file(s) | HeroUI v3 building blocks |
| --- | --- | --- |
| "Available Balance" stat cards (colored) | `components/home/card-balance*.tsx` | `Card` (`components/card`), `Chip`, `Avatar` |
| Area chart ("Statistics") | `components/charts/steam.tsx` (ApexCharts / `react-apexcharts`) | needs a chart lib — none installed. ApexCharts or Recharts. |
| "Latest Transactions" list | `components/home/card-transactions.tsx` | `Card` + `Avatar` + list markup, or `Table` (`components/table`) |
| "Section" / Agents card (right rail) | `components/home/card-agents.tsx` | `Card`, `Avatar` group |
| Right rail layout (content + aside grid) | `components/home/content.tsx` | CSS grid in the page / a section layout |
| Breadcrumbs above tables | `components/breadcrumb/*` | `Breadcrumbs` (`components/breadcrumbs`) |
| Data tables (accounts, etc.) | `components/table/*` | `Table` (`components/table`) |

## Known gaps / follow-ups

- **Other section layouts** (`app/{groups,applications,reports}/layout.tsx`) still
  use the template's centered `max-w-lg text-center` wrapper, which looks odd
  inside the dashboard shell. Use a plain left-aligned wrapper when those
  sections get real content.
- **Collapsed disclosure panels** keep their child links in the a11y tree /
  tab order (height-clipped only). Fine for now; revisit if keyboard nav matters.
- **Account avatar** shows the signed-in user's initials (a styled `<span>` in
  `components/topbar.tsx`). Swap in a photo when the auth server provides one.
