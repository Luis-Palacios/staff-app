# Dashboard layout — notes & porting guide

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
| Top bar with wide search + right cluster | `components/topbar.tsx` | `"use client"`. Search is `flex-1 sm:max-w-2xl` (the "extend the search input" ask). Right cluster = theme switch, GitHub link, avatar. Hamburger + small logo show `lg:hidden`. |
| Nav data model with nesting | `config/site.ts` | `navItems: NavItem[]`; `NavItem` has `icon`, optional `href` (leaf) OR optional `items` (collapsible group). `navMenuItems` was deleted — the sidebar drives both desktop and mobile now. |
| Nav / chrome icons | `components/icons.tsx` | Hand-rolled 24×24 stroke SVGs (`DashboardIcon`, `GroupsIcon`, `ApplicationsIcon`, `ReportsIcon`, `BalancesIcon`, `ChevronDownIcon`, `MenuIcon`, `CloseIcon`). Same `IconSvgProps` contract as the existing icons. No icon library is installed. |
| `Balances` nested example + stub routes | `app/balances/{layout,page}.tsx`, `app/balances/transactions/page.tsx` | Demonstrates a collapsible group with two children. |
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
    label: "Balances", icon: "balances",                        // collapsible group
    items: [
      { label: "Overview", href: "/balances" },
      { label: "Transactions", href: "/balances/transactions" },
    ],
  },
]
```

- **Add a top-level link:** add an object with `label`, `icon`, `href`.
- **Add a nested menu:** give the item `items: [...]` instead of `href`.
- **Add an icon:** add the key to `NavIconName` in `config/site.ts`, add the SVG
  to `components/icons.tsx`, and register it in `iconRegistry` in
  `components/sidebar.tsx`.
- **Active state:** leaves and parents use prefix matching
  (`/groups` is active on `/groups/123`); nested children use exact matching so
  `/balances` and `/balances/transactions` don't both light up. A group auto-
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
- Search is `flex-1` down to `sm`, capped at `max-w-2xl` from `sm` up. GitHub link
  is `hidden sm:inline-flex`.

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

- **`pnpm lint` is broken repo-wide** (pre-existing, unrelated to this change):
  `eslint-config-next`'s `plugin:@next/next/recommended` trips the flat-config
  compat layer with `Unexpected top-level property "name"`. Type-check via
  `npx tsc --noEmit` still works.
- **Other section layouts** (`app/{groups,applications,reports}/layout.tsx`) still
  use the template's centered `max-w-lg text-center` wrapper, which looks odd
  inside the dashboard shell. `app/balances/layout.tsx` uses a plain
  left-aligned wrapper — copy that when those sections get real content.
- **Collapsed disclosure panels** keep their child links in the a11y tree /
  tab order (height-clipped only). Fine for now; revisit if keyboard nav matters.
- **Avatar** is initials-only (`SA`). Swap in `<Avatar.Image src=... />` when
  there's a real user.
- **`config/site.ts` `links`** still carries the template's twitter/discord/docs/
  sponsor URLs; only `links.github` is used (top-bar icon).
