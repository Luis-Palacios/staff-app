# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Staff app for managing staff, groups, applications, and reports. Built from the
HeroUI v3 + Next.js 16 App Router template; most section pages (`groups`,
`applications`, `reports`) are still stubs awaiting real UI and data.

See `docs/AUTH-INTEGRATION-ROADMAP.md` for the in-progress, phased plan wiring this app together
with the sibling `auth-server` (better-auth) and `membership-applications` (FastAPI) repos —
pick up at whichever phase is still marked `[ ]`.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`).

- `pnpm install` — install dependencies
- `pnpm dev` — dev server at http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint with `--fix` (auto-formats; there is no separate Prettier script — Prettier runs through `eslint-plugin-prettier`)
- `npx tsc --noEmit` — type-check (tsconfig is `noEmit`, so this is the only way to check types without a build)

There is **no test runner** configured. If asked to add tests, confirm the framework choice first.

## Architecture

- **Next.js 16 App Router** (`app/`). Every section is a folder with its own
  `layout.tsx` + `page.tsx`. `app/layout.tsx` is the root shell: fonts,
  `Providers`, and `<AppShell>` (which renders the sidebar, top bar, and the
  `max-w-7xl` main region). Older section layouts still use a centered
  `max-w-lg text-center` wrapper; `app/balances/layout.tsx` uses a plain
  left-aligned one — prefer that for new sections.
- **Dashboard shell** — `components/app-shell.tsx` (client; holds the mobile
  sidebar open state + body scroll lock) composes `components/sidebar.tsx`
  (bordered left rail, per-item icons, collapsible nested groups via HeroUI
  `Disclosure`, off-canvas + backdrop below `lg`) and `components/topbar.tsx`
  (wide search, theme switch, GitHub link, avatar, hamburger below `lg`).
  See `docs/dashboard-layout.md` for the full rationale and a porting guide for
  pulling more widgets from the `nextui-dashboard-template`.
- **`app/providers.tsx`** wraps the tree in `next-themes` only. Theme is
  class-based, defaults to `dark` (`themeProps` passed from `app/layout.tsx`).
  Add other client-side providers here.
- **HeroUI v3** (`@heroui/react`, `@heroui/styles`) is the component library.
  v3's API differs significantly from v2 — components are compound (e.g.
  `TextField` + `InputGroup.Prefix/Input/Suffix`, `Kbd.Abbr/Content` in
  `components/topbar.tsx`; `Disclosure.Trigger/Content/Body/Indicator` in
  `components/sidebar.tsx`). Check current v3 docs rather than assuming v2 props.
- **Tailwind CSS v4** — configured entirely in `styles/globals.css` via
  `@import "tailwindcss"`, `@import "@heroui/styles"`, `@theme { ... }`, and a
  `dark` custom variant. There is no `tailwind.config.*` file. PostCSS uses
  `@tailwindcss/postcss`.
- **Config-driven navigation** — `config/site.ts` (`siteConfig`) is the single
  source for site name, description (used in `metadata`), and nav items. Add or
  rename routes there, not inline in the sidebar. `NavItem` is either a leaf
  (`icon` + `href`) or a collapsible group (`icon` + `items[]`); icon keys
  resolve through `iconRegistry` in `components/sidebar.tsx`.
- **`components/primitives.ts`** — `title()` / `subtitle()` `tailwind-variants`
  helpers used for page headings; reuse these instead of ad-hoc heading classes.
- **`config/fonts.ts`** — `next/font/google` (Inter as `--font-sans`, Fira Code
  as `--font-mono`); wired in via `fontSans.variable` on `<body>`.
- **Path alias** — `@/*` maps to the repo root (`@/config/site`, `@/components/sidebar`).

## Conventions enforced by ESLint

The ESLint config (`eslint.config.mjs`) auto-fixes and will flag:

- **Import ordering** — grouped `type` → `builtin` → `object` → `external` →
  `internal` → `parent` → `sibling` → `index`, with blank lines between groups.
- **JSX prop sorting** — shorthand first, reserved (`key`, `ref`) first,
  callbacks last.
- **Padding lines** — blank line required before every `return` and after
  variable-declaration blocks.
- `no-console` is a warning; unused vars prefixed with `_` are allowed.
- Client components need `"use client"` (see `app-shell.tsx`, `sidebar.tsx`, `topbar.tsx`, `providers.tsx`, `theme-switch.tsx`, `error.tsx`).
- `@next/eslint-plugin-next` and `@tanstack/eslint-plugin-query` ship native
  ESLint 9 flat configs and are wired in directly as their own config blocks
  in `eslint.config.mjs` (not via `compat.extends(...)`), since routing a
  flat-config-native plugin through the legacy `FlatCompat` shim breaks on its
  top-level `name` field.
