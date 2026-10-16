# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Staff app for managing staff, groups, applications, and reports. Built from the
HeroUI v3 + Next.js 16 App Router template; most section pages (`applications`,
`reports`) are still stubs awaiting real UI and data. `members` has the real list,
detail and add/edit UI (see `docs/design/MEMBERS-LIST.md` and
`docs/design/MEMBER-DETAIL-AND-FORM.md`). `groups` has the list, a detail page with
member management (add, role, leader swap, remove, close) and add/edit (see
`docs/design/SMALL-GROUPS.md`); only group reports are still a stub.

See `docs/infrastructure/AUTH-INTEGRATION-ROADMAP.md` for the in-progress, phased plan wiring this app together
with the sibling `auth-server` (better-auth) and `membership-management` (FastAPI) repos —
pick up at whichever phase is still marked `[ ]`.

The UI is translated (English + Spanish) with next-intl, with no locale in the URL.
`docs/infrastructure/I18N-ROADMAP.md` holds the decisions and per-stage history; read
it when changing how translations work. For everyday UI text, see "Adding UI text" below.

Design work (brand restyle, shell, account menu, ministry/church context) is implemented
and paused; its specs and history live in `docs/design/`. Read them only when resuming
design work or changing those areas — not needed for routine tasks. Exception: before any
change to colors, fonts, radii, shadows or the theme, read "Design tokens" below and
`docs/design/README.md`. New feature specs start from `docs/design/HANDOFF-TEMPLATE.md`.

## Commands

Package manager is **pnpm 12.3.4**, pinned in `package.json` (`devEngines` + `packageManager`).
Use `pnpm exec`/`pnpm dlx`, not `npx`: npm refuses to run here because of `devEngines`.

- `pnpm install` — install dependencies
- `pnpm dev` — dev server at http://localhost:3001
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm tokens` — regenerate `styles/brand.css` and `styles/theme.css` from `tokens/`
  (`pnpm tokens --check` exits 1 if they're out of date; run it before committing token changes)
- `pnpm lint` — ESLint with `--fix` (auto-formats; there is no separate Prettier script — Prettier runs through `eslint-plugin-prettier`)
- `pnpm exec tsc --noEmit` — type-check (tsconfig is `noEmit`, so this is the only way to check types without a build)

There is **no test runner** configured. If asked to add tests, confirm the framework choice first.

## Architecture

- **Next.js 16 App Router** (`app/`). There are three layouts:
  - `app/layout.tsx` (root): fonts, metadata and `Providers` only.
  - `app/(app)/layout.tsx`: the session check (redirects to `/sign-in`,
    `/needs-verification` or `/needs-role`), `UserProvider`, and `<AppShell>`
    (sidebar, top bar and the `max-w-7xl` main region). Auth gating and shell
    changes belong here.
  - `app/(auth)/layout.tsx`: the two-panel sign-in frame for every auth page.

  Sections are folders under `(app)` with a `page.tsx` and a `_components/`
  folder, but no layout of their own. Pages start with `StaffAppPageHeader`
  and lay out left-aligned below it. List pages show a `dataTable()` table from
  `md` up and `card()` summaries below it. `app/(app)/error.tsx` renders page
  errors inside the shell; `app/error.tsx` only catches errors in the `(app)`
  layout itself.
- **Dashboard shell** — `components/app-shell.tsx` (client; holds the mobile
  sidebar open state + body scroll lock) composes `components/sidebar.tsx`
  (navy brand rail in both modes: logo, `ChurchContextCard`, Heroicons-outline nav
  items, collapsible groups via HeroUI `Disclosure`, off-canvas + backdrop below
  `lg`) and `components/topbar.tsx` (search with Ctrl/⌘ K hint, segmented
  `ThemeSwitch`, account menu (header, Language, My profile, Sign out); below `lg`
  hamburger + mark + a read-only ministry › church label; below `sm` search collapses
  behind an icon and the theme options move into the account menu).
- **Brand components** — `components/brand/` holds `EkklesiaioMark` /
  `EkklesiaioLogo` (`tone: "on-dark" | "on-light" | "auto"`) and
  `ChurchContextCard` / `MinistryMark` (ministry › church card on the rail; the
  hook for per-ministry/church branding).
- **Ministry/church context** — `getChurchContext()` (`lib/workspace.ts`,
  server-only, `cache()`d) is the only way to read the ministry and church;
  never read `siteConfig.ministry` / `siteConfig.churches` directly.
- **Locale and translations (next-intl; see "Adding UI text" below)**. `i18n/request.ts`
  feeds `getLocale()` and `messages/<locale>.json` to next-intl, and only
  `CLIENT_NAMESPACES` (`i18n/client-namespaces.ts`) reach the browser. — `getLocale()`
  (`lib/locale.ts`, server-only, `cache()`d) resolves `en`/`es` per request:
  the `ekk_locale` cookie if valid, else `Accept-Language`, else `en`. It sets
  `<html lang>` in `app/layout.tsx` and reaches the account menu as a `locale`
  prop (`(app)` layout → `AppShell` → `Topbar`); the menu's picker calls the
  `setLocale` server action. Client code imports constants and types from
  `lib/locale-shared.ts`, never `lib/locale.ts`, and never reads the cookie.
- **`app/providers.tsx`** wraps the tree in `next-themes` only. Theme is
  class-based, defaults to `system` (`themeProps` passed from `app/layout.tsx`).
  Add other client-side providers here.
- **HeroUI v3** (`@heroui/react`, `@heroui/styles`) is the component library.
  v3's API differs significantly from v2 — components are compound (e.g.
  `TextField` + `InputGroup.Prefix/Input/Suffix`, `Kbd.Abbr/Content` in
  `components/topbar.tsx`; `Disclosure.Trigger/Content/Body/Indicator` in
  `components/sidebar.tsx`). Check current v3 docs rather than assuming v2 props.
- **Tailwind CSS v4** — configured entirely in `styles/globals.css` via
  `@import "tailwindcss"`, `@import "@heroui/styles"`, `@import "./brand.css"`
  (brand palette, fonts, display sizes, radii, shadows as `@theme` variables),
  `@import "./theme.css"` (the brand mapped onto HeroUI's theme variables, light +
  dark), a `dark` custom variant, the focus-halo rule and an `@theme inline` block
  exposing custom semantic tokens as utilities. **`brand.css` and `theme.css` are
  generated from `tokens/`** (see "Design tokens"). There is no `tailwind.config.*`
  file. PostCSS uses `@tailwindcss/postcss`.
- **Roles and permissions** — what a role can do is decided only in auth-server's
  `src/permissions/statements.ts`, which ships the computed `permissions` in the session
  (`AuthSession.permissions`). This app checks **permissions, never role names**:
  `can(permissions, { resource: [actions] })` (`lib/auth/permissions.ts`, all-of), server side with
  `getPermissions()` / `hasPermission()` / `requirePermission()` (`notFound()`) /
  `forbiddenUnless()` (server actions) from `lib/auth/get-permissions.ts`, client side with
  `usePermissions()`. A nav item and its page use the same check, and a server action checks before
  calling the API. A session without `permissions` has none. `lib/auth/roles.ts` is role names only
  (labels, assigning a role). Rules and the role × route table: `docs/design/ROLES-PERMISSIONS.md`.
- **Config-driven navigation** — `config/site.ts` (`siteConfig`) is the single
  source for the site name and nav items (labels are `Nav` message keys; the
  description is `Metadata.description`). Add or rename routes there, not
  inline in the sidebar. `NavItem` is either a leaf
  (`icon` + `href`) or a collapsible group (`icon` + `items[]`); `requires` (a permission check) hides
  items and links the caller can't use, `unless` the leaf that stands in for a group; icon keys
  resolve through `iconRegistry` in `components/sidebar.tsx`.
- **`components/primitives.ts`** — `title()` (Newsreader display heading,
  `sm`/`md`/`lg`), `subtitle()` (muted body), `textLink()` (navy link with gold
  underline) and `card()` (content card surface; `interactive: true` for a card
  that is itself a link)
  `tailwind-variants` helpers; reuse these instead of ad-hoc classes.
- **Shared page patterns** (brand-restyle Stage 4) — reuse rather than restyling
  HeroUI inline: `StaffAppPageHeader` (breadcrumbs, eyebrow, title, description,
  actions), `StatusBadge` (dot + word; never HeroUI `Chip`), `InitialsAvatar`,
  `EmptyState`, and `components/data-table.tsx` (`dataTable()` slot classes for
  HeroUI `Table` `variant="secondary"` plus primary-cell, "Open" action and
  footer components).
- **`config/fonts.ts`** — `next/font/google` brand trio: Figtree (body,
  `--font-figtree` → `font-sans`), Newsreader (`--font-newsreader` →
  `font-display`), Inter (wordmark only, `--font-inter` → `font-logo`); all three
  `.variable`s go on `<html>` (`brand.css` reads them on `:root`).
- **Path alias** — `@/*` maps to the repo root (`@/config/site`, `@/components/sidebar`).

## Design tokens

`tokens/` (W3C DTCG JSON) is the **source of truth for the ekklesiaio brand**, for this app and
for the design system and landing page that are synced from it. Full guide:
`docs/design/README.md`.

- `tokens/brand.json` → `styles/brand.css` (`@theme`: `--color-navy-900` → `bg-navy-900`, …),
  and also → `../ekklesiaio-landing/brand/theme.css` when that sibling repo is checked out (commit it
  there too; it keeps the landing page's own names via `LANDING_ALIASES` in `tokens/build.mjs`).
  `tokens/themes/{light,dark}.json` → `styles/theme.css` (`--background`, `--accent`, …).
- **Never edit `styles/brand.css` or `styles/theme.css`.** Change the JSON, run `pnpm tokens`,
  commit the JSON and the generated CSS together (`pnpm tokens --check` must pass).
- A new semantic token goes in both `themes/light.json` and `themes/dark.json`, with a
  `$description` saying where it's used. If components need a utility for it, add it to
  `@theme inline` in `styles/globals.css`.
- No color, font-stack, radius or shadow literals in components or `globals.css`, and no
  component-level `dark:` overrides a token could express. Page content uses semantic tokens;
  raw brand colors only where the look is the same in both themes (the rail).
- Gold never carries text on a light ground (`--eyebrow` / gold-800 instead); status is never
  color alone.
- After a token change merges, the ekklesiaio Design System and the canvases need a re-sync
  (see "Keeping the design system and the landing page in sync" in `docs/design/README.md`).
  Mention it when you finish a token change.

## Adding UI text

All UI text lives in `messages/en.json` (source of truth) and `messages/es.json`,
and goes through next-intl. Never hard-code a string in JSX.

- **Namespace per feature or component** (`UsersTable`, `SignInForm`), `PascalCase`;
  keys `camelCase`. Add the English key and the Spanish in the same change.
- **Server first.** In Server Components use `getTranslations("Ns")` (async) or
  `useTranslations("Ns")`; the browser gets plain text. Only a `"use client"`
  component that calls `useTranslations("Ns")` needs `Ns` in `CLIENT_NAMESPACES`
  (`i18n/client-namespaces.ts`), which is what ships to the browser. Components
  imported by a client component count as client code. Prefer passing a label or two
  as props from a server parent over adding a client namespace.
- **ICU for dynamic text**: `{count, plural, one {…} other {…}}`, `{n, number}` for
  quantities, `t.rich` for inline markup. Never concatenate sentences. Pass ids as
  strings (`String(id)`): a bare `{id}` is typed `string`. Avoid `t.raw` (precompiled
  messages don't support it).
- **Not translated**: user data, ministry and church names, API-supplied names (e.g.
  timeline event types), language endonyms, the brand wordmark.
- **Type checks** (`pnpm exec tsc --noEmit`): unknown keys and missing ICU arguments
  fail, and `messages/parity.ts` fails when `es.json` lacks a key `en.json` has.
  `messages/en.d.json.ts` is generated by `pnpm dev`/`pnpm build` from `en.json`:
  commit it with the change, never edit it.
- **Dates and numbers** follow the picked language: pass `useLocale()` to
  `lib/format-date.ts`, never `undefined`.
- **Errors**: map auth-server `error.code` with `useAuthErrorMessage()` and API HTTP
  status with `getApiErrorMessage()`; never show backend English text.
- The `react/jsx-no-literals` lint warning flags hard-coded JSX text.
- Spanish conventions: *tú*, *grupo pequeño* (not *célula*).

## Conventions enforced by ESLint

The ESLint config (`eslint.config.mjs`) auto-fixes and will flag:

- **Import ordering** — grouped `type` → `builtin` → `object` → `external` →
  `internal` → `parent` → `sibling` → `index`, with blank lines between groups.
- **JSX prop sorting** — shorthand first, reserved (`key`, `ref`) first,
  callbacks last.
- **Padding lines** — blank line required before every `return` and after
  variable-declaration blocks.
- **`react/jsx-no-literals`** (warning, `app/` and `components/`) — hard-coded JSX text;
  see "Adding UI text".
- `no-console` is a warning; unused vars prefixed with `_` are allowed.
- Client components need `"use client"` (see `app-shell.tsx`, `sidebar.tsx`, `topbar.tsx`, `providers.tsx`, `theme-switch.tsx`, `error.tsx`).
- `@next/eslint-plugin-next` and `@tanstack/eslint-plugin-query` ship native
  ESLint 9 flat configs and are wired in directly as their own config blocks
  in `eslint.config.mjs` (not via `compat.extends(...)`), since routing a
  flat-config-native plugin through the legacy `FlatCompat` shim breaks on its
  top-level `name` field.
