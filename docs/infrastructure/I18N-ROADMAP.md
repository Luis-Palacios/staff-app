# i18n Roadmap (next-intl, English + Spanish)

Working doc for translating the staff app's UI into Spanish with
[next-intl](https://next-intl.dev). It is split into small stages, one PR each, so every
PR stays easy to review. Pick up at whichever stage is still marked `[ ]`.

## What already exists

The account menu has a language picker (`docs/design/ACCOUNT-MENU-AND-LANGUAGE.md`,
Stage 2). It only stores a preference:

- **Storage: a cookie, not localStorage.** `ekk_locale` is an `httpOnly` cookie with a
  one-year lifetime. The `setLocale` server action (`app/(app)/_actions/set-locale.ts`)
  writes it and calls `revalidatePath("/", "layout")`, which re-renders the layouts.
- **Resolution:** `getLocale()` (`lib/locale.ts`, server-only, `cache()`d) returns the
  cookie if it holds a valid value. Otherwise it uses the first supported language in
  `Accept-Language`, and falls back to `en`.
- **Effect today:** the check mark moves and `<html lang>` changes. No text is
  translated yet.

**Keep the cookie.** It is the right storage for this setup, and it already meets
"local, not in the DB". The server renders the page, so the server must know the
language on the very first request. A cookie travels with every request. localStorage
is only readable in the browser after hydration, so every page would first render in
English and then switch to Spanish, causing a flash and hydration mismatches. The
cookie also survives sign-out on purpose. Saving the choice to the user's profile
stays future work; the `TODO(i18n)` in `set-locale.ts` marks where it would go.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Library | `next-intl` v4 (latest 4.x at Stage 1) | The standard for the App Router. Works in Server Components, supports ICU plurals, and has typed keys. |
| URL prefix (`/en`, `/es`) | **None.** Use next-intl's ["without i18n routing"](https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing) setup | An internal app behind auth needs no SEO, and it keeps URLs, `proxy.ts` and links unchanged. |
| Source of the locale | Our existing `getLocale()`, called from `i18n/request.ts` | It stays the one source of truth. next-intl just reads it. |
| Message files | One file per language: `messages/en.json`, `messages/es.json` | This is what next-intl, its type generation and its precompile option expect. |
| Organisation inside the file | Top-level **namespace per feature or component** (`Topbar`, `Sidebar`, `SignInForm`, `UsersTable` …), plus a small `Common` namespace | Gives the "component-based" feel without a custom file loader. A PR's diff to `en.json` is one self-contained block. |
| Source language | `en.json` is the source of truth for keys and types | TypeScript then rejects unknown keys at `tsc` time. |
| Key style | Namespaces `PascalCase`, keys `camelCase`, grouped by meaning (`columns.email`, `errors.generic`) | Matches next-intl's docs and reads well in `t("columns.email")`. |
| Dynamic text | ICU syntax: `{count, plural, one {# invite} other {# invites}}`, `t.rich` for inline markup | Spanish plurals and word order differ, so never build sentences by concatenation. |
| Not translated | User data (names, testimonies, emails), ministry and church names, and language endonyms (`English`/`Español` in `LOCALE_LABELS`) | Data is not UI. Endonyms are deliberately shown in their own language. |

### Considered and not chosen

- **Per-component JSON files** (`app/(app)/users/_components/messages/en.json`). These need a
  custom loader that merges files in `request.ts`, they work against next-intl's tooling,
  and they make missing-key checks harder. Namespaces inside one file give most of the
  same locality.
- **`useExtracted` (next-intl's experimental message extraction).** It writes keys from
  the source text for you. It is still experimental, and explicit keys are easier to review
  in small PRs. Worth a second look once it is stable.
- **localStorage for the choice.** See "Keep the cookie" above.

## Performance plan

Most of the speed of an i18n setup comes from **where translation happens**, not from
the library. In order of impact:

1. **Translate in Server Components by default.** `getTranslations()` (async components)
   and `useTranslations()` (non-async Server Components) run on the server. The result
   is plain text in the HTML, so **no messages and no formatting runtime reach the
   browser** for those components. Most of our pages and `_components` are already
   Server Components.
2. **Ship only client namespaces to the browser.** By default, next-intl v4's
   `NextIntlClientProvider` passes *every* message to the client. We pass a filtered set
   instead: `messages={pick(messages, CLIENT_NAMESPACES)}`. `CLIENT_NAMESPACES` lives in
   `i18n/client-namespaces.ts`, and a namespace is added there only when a
   `"use client"` component calls `useTranslations` with it. That list is the explicit,
   reviewable record of what the client pays for.
3. **Prefer props over new client namespaces** for small client leaves. If a client
   component only needs two labels (e.g. `ConfirmDialog`'s buttons, or column headers
   for a client table), translate them in the Server Component parent and pass strings
   down. Use `useTranslations` in the client only when the strings are many, or depend
   on client state (form validation, error codes, toggles).
4. **Load one language per request.** `i18n/request.ts` uses
   `` await import(`../messages/${locale}.json`) ``, so only the active language is loaded,
   on the server only.
5. **No new rendering cost.** `getLocale()` reads cookies, so pages are dynamic. They
   already are because of the session check. We don't need `setRequestLocale` or static
   params, which only matter for static rendering with locale routes.
6. **Layouts are sent once.** The provider sits in the root layout. On client-side
   navigation the layout is not re-sent, so the client messages travel once per full
   page load, and again after a language switch.
7. **Optional, last stage: precompiled messages.** next-intl 4.8+ can compile ICU
   messages at build time (`experimental.messages.precompile`). This drops the message
   parser from the client bundle (~9 KB compressed) and speeds up formatting. It is
   experimental, and it does not support `t.raw`. So: avoid `t.raw` from day one, and
   try precompiling in Stage 12 with before/after bundle numbers.

Also: `intl-messageformat` is in `dependencies` but nothing imports it. Remove it in
Stage 1, since next-intl ships its own copy.

## Type safety and missing translations (no test runner needed)

- **Typed keys.** `global.ts` augments next-intl's `AppConfig` with `Locale` (from
  `lib/locale-shared.ts`) and `Messages: typeof en`. Then `t("typo")`, a wrong
  namespace, or a missing `en.json` key fails `pnpm exec tsc --noEmit`.
  - It must be **`global.ts`, not `global.d.ts`**. `skipLibCheck: true` hides errors in
    `.d.ts` files, and in Stage 1 that hid the augmentation silently not reaching
    `getTranslations`.
  - TypeScript only applies the augmentation once some file imports `"next-intl"`. The
    root layout does, so this is always true now.
  - Placeholders aren't type-checked: `t("trigger")` without `{ name }` compiles. See
    Stage 12.
- **Spanish parity check.** `messages/parity.ts` is types only, so nothing runs at
  runtime:
  ```ts
  import type en from "./en.json";
  import type es from "./es.json";

  type AssertComplete<Translation extends Source, Source> = Translation;

  export type SpanishIsComplete = AssertComplete<typeof es, typeof en>;
  ```
  Every stage's PR then cannot merge a key in English without its Spanish. This is the
  same `tsc` command we already run, so there is no new tooling.
- **Runtime safety net.** next-intl's defaults already cover this, so `request.ts` sets
  no `onError` / `getMessageFallback`. A missing message is logged with `console.error`,
  and the page shows `Namespace.key` instead of crashing.

## Shape of the code after Stage 1

```
i18n/
  request.ts            # getRequestConfig: locale from lib/locale.ts, messages for it
  client-namespaces.ts  # CLIENT_NAMESPACES + pick() helper
messages/
  en.json               # source of truth
  es.json
  parity.ts             # compile-time completeness check
global.ts               # AppConfig augmentation (typed keys, typed locale)
next.config.mjs         # wrapped with createNextIntlPlugin()
app/layout.tsx          # <NextIntlClientProvider messages={pick(...)}> inside <Providers>
app/providers.tsx       # + HeroUI/react-aria <I18nProvider locale={locale}>
```

```ts
// i18n/request.ts
import { getRequestConfig } from "next-intl/server";

import { getLocale } from "@/lib/locale";

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

Notes:

- `next-intl/server` also exports a `getLocale`. App code keeps importing ours from
  `@/lib/locale`. Both return the same value, but ours is the documented entry point
  (CLAUDE.md).
- **react-aria / HeroUI built-in strings** (e.g. hidden "Dismiss" buttons, calendar
  and number formats) follow react-aria's own locale, which defaults to the browser.
  `@heroui/react` re-exports `I18nProvider`. Wrapping the tree with
  `<I18nProvider locale={locale}>` makes those strings follow the picker too.
- The language switch needs no new code. `setLocale` already revalidates the root
  layout, which re-runs `request.ts` with the new cookie. Server text and the
  provider's client messages then arrive in the new language in the same response.

## Working process for every stage

1. One branch and one PR per stage, as with the brand-restyle stages.
2. Move strings into `en.json` and add the Spanish in `es.json` in the **same PR**. The
   parity check enforces this.
3. Before opening the PR, run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build`.
   Then click through the stage's pages in both languages, switching from the account
   menu. Check narrow widths too: Spanish runs about 20–30% longer than English, so watch
   buttons, table headers, the sidebar and the topbar label at 390px.
4. Tick the stage below and note anything deferred.

---

## Stages

### Stage 1 — Foundation + account menu `[x]`

Install and wire next-intl, and translate the account menu as the smoke test. It is where
the picker lives, so switching language immediately proves the whole loop end to end.

- `pnpm add next-intl`, `pnpm remove intl-messageformat`.
- Add `i18n/request.ts`, `i18n/client-namespaces.ts`, `messages/{en,es}.json`,
  `messages/parity.ts` and `global.ts`, all as described above.
- Wrap `next.config.mjs` with `createNextIntlPlugin()`.
- `app/layout.tsx`: add `NextIntlClientProvider` with the filtered messages.
  `app/providers.tsx`: add `I18nProvider`, which needs a `locale` prop from the root layout.
- Translate the account menu in `components/topbar.tsx`: section headers (Theme,
  Language, "Default: your browser"), My profile, Sign out, the trigger's `aria-label`.
  Namespace: `AccountMenu`, client. Theme option labels come from `THEME_OPTIONS`, so
  move them to keys here as well (`ThemeSwitch` namespace, client).
- Remove the "Preference only for now" comment in `topbar.tsx`, and update
  `lib/locale-shared.ts`'s header comment.

**Done when:** picking Español in the account menu translates the menu itself, `tsc`
fails if `es.json` misses a key, and `pnpm build` passes.

**Done (2026-10-10).** Notes:

- next-intl 4.14.9 was installed. Its message extractor brings `@parcel/watcher` and
  `@swc/core`. Their install scripts are set to `false` in `pnpm-workspace.yaml`'s
  `allowBuilds`: we don't use extraction, and both ship prebuilt binaries.
  `intl-messageformat` remains in the lockfile as a dependency of HeroUI and next-intl.
- Both type checks were proven by breaking them on purpose: a deleted `es.json` key, and
  `t("signOutt")`.
- Not yet verified: that the browser receives only `CLIENT_NAMESPACES`. Today every
  namespace is a client one. Check it in the first stage that adds a server-only
  namespace. (Verified in Stage 2.)
- Still English in the topbar: search, "Open menu", the home link's label and the role
  badge (Stage 2).

### Stage 2 — App shell and navigation `[x]`

- **Sidebar nav:** `config/site.ts`'s `NavItem.label` becomes a translation key
  (`labelKey`, typed as a key of the `Nav` namespace). `components/sidebar.tsx` translates
  it. Keep `config/site.ts` as the single source of routes. `Nav` is client.
- **Rest of the topbar:** search placeholder and `aria-label`s ("Open menu", "Search",
  "ekklesiaio home").
- **`ChurchContextCard`** labels and the sidebar footer, but not the ministry or church
  names.
- **Breadcrumbs:** `config/breadcrumbs.ts` stores keys rather than labels, the same
  approach as the nav.
- **Roles:** `ROLE_LABELS` (`lib/auth/roles.ts`) becomes a `Roles` namespace. It is used
  on both sides (topbar, users table, role display), so `roleLabel()` takes a `t`, or
  callers use `` t(`Roles.${role}`) `` directly. Decide once here, then reuse it.
- **Metadata:** the root `metadata` becomes `generateMetadata()` using
  `getTranslations("Metadata")` (site description, title template).
- **Stub pages** `groups/page.tsx` and `groups/reports/page.tsx`: page header text only.

**Done (2026-10-10).** Notes:

- **Namespaces added:** `Nav`, `Sidebar`, `Topbar`, `ChurchContext` and `Roles` (client),
  plus `Metadata`, `GroupsPage` and `ReportsPage` (server only).
- **Nav keys:** `NavLabelKey = keyof Messages["Nav"]`, so a nav item or breadcrumb that
  names a missing key fails `tsc`. Page titles reuse the same keys (`tNav("groups")`),
  so the rail, the crumb and the heading can't drift apart.
- **Breadcrumbs:** `StaffAppBreadcrumbItem` is either `{ labelKey }` (a page, translated
  by `StaffAppBreadcrumbs` itself) or `{ label }` (data such as an applicant's name,
  shown as is). Pages still pass the shared objects from `config/breadcrumbs.ts`.
- **Roles decision:** callers translate directly: `useTranslations("Roles")` or
  `getTranslations("Roles")`, then `t(role)`. The keys are the `AuthRole` values, so a
  role without a label fails `tsc`. Where an unknown role could arrive at runtime
  (`AuthRole` mirrors auth-server by hand), guard with `t.has(role)` and show the raw
  value, as the topbar does. `ROLE_LABELS` is `@deprecated` and stays until Stages
  10–11 move the users and invites pages over, then gets deleted.
- **Metadata:** `siteConfig.description` moved to `Metadata.description`; the site name
  stays in config (brand, not translated).
- **Verified:** server-only namespaces don't reach the browser. `/sign-in`'s payload
  carries only `CLIENT_NAMESPACES`, and the description appears only as the `<meta>`
  tag. The church menu (with a temporary second church) shows "2 iglesias", and every
  shell `aria-label` comes out in Spanish.
- **Not verified:** the 390px check, because the automated browser window couldn't be
  resized. Check the sidebar and topbar on a phone width before merging.
- **Left as is:** the `Ctrl` key hint (Spanish keyboards say `Ctrl` too). "ekklesiaio
  home" lives in both `Sidebar` and `Topbar` instead of a shared `Common` namespace,
  which would be a client namespace that grows; revisit in Stage 3 if more repeats appear.

### Stage 3 — Shared components and error pages `[x]`

- `EmptyState`, `ErrorState`, `ConfirmDialog` (default Confirm/Cancel labels),
  `components/data-table.tsx` ("Open" action, footer text such as "Showing 1–10 of 42",
  as an ICU message), `StatusBadge` (only if it holds fixed words), the skeletons'
  `aria-label`s, and `StaffAppPageHeader` / breadcrumbs ("Home", the `aria-label`).
- `app/error.tsx`, `app/(app)/error.tsx`, `app/(app)/loading.tsx`.
- Rule from the performance plan: server parents pass strings into client leaves where
  that is simpler than adding a client namespace.

**Done (2026-10-10).** Notes:

- **Namespaces added:** `ErrorState`, `ConfirmDialog` and `DataTable` (client), plus
  `Loading` (server only).
- **Why client:** error boundaries must be `"use client"` and have no server parent to
  pass props from. `ConfirmDialog`, `DataTableOpenLink` and `DataTableFooter` are only
  rendered by client components, so a prop would just move the same `useTranslations`
  into every caller.
- **`Loading` is server only.** `(app)/loading.tsx`, `TableSkeleton` and
  `PersonTimelineSkeleton` are only imported by server pages. Importing a skeleton into
  a client component would show `Loading.label`; add the namespace to
  `CLIENT_NAMESPACES` or pass the label as a prop then.
- **Footer:** `DataTable.showing` is `Showing {start}–{end} of {total}`, with no plural:
  "1–1 of 1" reads fine in both languages.
- **No change needed:** `EmptyState`, `StatusBadge` and `StaffAppPageHeader` take all
  their text through props. The breadcrumbs' `aria-label` comes from react-aria
  ("Migas de pan") through Stage 1's `I18nProvider`; "Home" was done in Stage 2.
- **Still props, translated by callers later:** `ConfirmDialog`'s `title`, body and
  `confirmLabel`, and `DataTableOpenLink`'s `label` (Stages 8–11). No default
  "Confirm" label was added; a specific verb reads better.
- **Verified:** in Spanish, the users and applications footers, "Abrir", the error
  page (via `/applications/999999999`), and the "Cargando" / "Cargando historial"
  fallbacks in the streamed HTML. `Loading` is not in the browser payload. Not clicked
  through: `ConfirmDialog`'s "Cancelar", since opening it means staging a role change.
- **Found:** an unknown application id shows the error page rather than a not-found
  page. That predates i18n; look at it in Stage 9.

### Stage 4 — Dates follow the selected language `[x]`

Today `lib/format-date.ts` calls `Intl.DateTimeFormat(undefined, …)`, so dates follow
the *browser* language. A Spanish-browser user who picks English still sees Spanish
dates.

- Give the `formatLocal*` helpers a `locale` argument. `LocalFormattedDate` and the
  `Local*` wrappers read it with `useLocale()` (from `next-intl`) and pass it in.
- **Keep formatting after mount.** That part exists for the *time zone*: the server
  doesn't know the user's zone. Changing the language doesn't change that.
- Check numbers too (stat tiles, counts), and use `Intl.NumberFormat(locale)` or
  `useFormatter()` where numbers are shown.

**Done (2026-10-11).** Notes:

- `formatLocal*` in `lib/format-date.ts` now take a `locale` argument and pass it to
  `Intl.DateTimeFormat`. `LocalFormattedDate` reads it with `useLocale()` and re-formats
  when it changes. `TodayDate` (dashboard eyebrow) does the same. The `Local*` wrappers
  needed no change.
- Formatting still happens after mount, because the time zone is the browser's.
- **Numbers:** nothing uses `Intl.NumberFormat` or `toLocaleString` today. The counts
  shown are small integers rendered as plain digits (`needs-attention-card.tsx`, the
  `applications-browser.tsx` "N applications" text), and those strings get their ICU
  plurals in Stages 7–8. Use `useFormatter()` there if a number can reach 1,000.
- **Not verified in a browser:** dates in both languages. Checked by `pnpm exec tsc --noEmit`,
  `pnpm lint` and `pnpm build` only.

### Stage 5 — Auth pages, part 1: sign-in, sign-up, password reset `[x]`

- `app/(auth)/layout.tsx` (the two-panel frame's copy), `AuthHeading`, `AuthTextField`
  and `PasswordField` (show/hide labels).
- `sign-in`, `sign-up`, `forgot-password`, `reset-password` pages and forms.
- **Auth error messages.** The forms show better-auth's `error.message`, which is
  English from the server. Add one helper, e.g. `useAuthErrorMessage()`. It maps
  better-auth's `error.code` (`INVALID_EMAIL_OR_PASSWORD`, `USER_ALREADY_EXISTS`, …) to
  an `AuthErrors` namespace key, and falls back to a translated generic message for
  unknown codes. It is reused by every later stage that calls `authClient`.
- These pages are public, so the language comes from `Accept-Language` until the
  user has picked one. That is the expected behaviour.

**Done (2026-10-11).** Notes:

- **Namespaces added:** `AuthErrors`, `PasswordField`, `SignInForm`, `SignUpForm`,
  `ForgotPasswordForm` and `ResetPasswordForm` (client), plus `AuthLayout` and
  `SignInPage` (server only; the page translates the notice and passes it down).
- **Error helper:** `useAuthErrorMessage()` in `lib/auth/use-auth-error-message.ts`
  maps `error.code` to an `AuthErrors` key, matches HTTP 429 by status (rate limiting
  has no code), and falls back to `AuthErrors.generic`. Stages 6, 10 and 11 reuse it.
  Every form now shows that text instead of better-auth's English `error.message`.
- **Left as is:** the `EMAIL_NOT_VERIFIED` and `INVALID_TOKEN` branches in the sign-in
  and reset forms still redirect or switch screens before the helper runs.
- **Not verified in a browser:** the pages in both languages or at 390px. Checked by
  `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build` only.

### Stage 6 — Auth pages, part 2: verification, pending role, invites `[x]`

- `needs-verification` (and `ResendVerificationButton`), `needs-role`, and
  `accept-invite` (`accept-invite-client.tsx`, including its "invalid or expired" states).
- Reuses Stage 5's error helper.

**Done (2026-10-11).** Notes:

- **Namespaces added:** `ResendVerificationButton`, `NeedsRolePage` and `AcceptInvite`
  (client), plus `NeedsVerificationPage` (server only; uses `t.rich` for the bold email).
- **Errors:** the resend button now uses `useAuthErrorMessage()`. The invite page shows a
  fixed "invalid or has expired" text for any failure except HTTP 429, which goes through
  the helper, because the invite plugin's codes aren't mapped. Add codes to `CODE_TO_KEY`
  if finer messages are wanted.
- **Left as is:** `AcceptInviteClient` keeps the translated message in state, so it
  doesn't change if the language is switched while the error is showing (the page is
  public and has no picker).
- **Verified:** the project owner clicked through the three pages in Spanish and found
  nothing to fix. Also checked by `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build`.

### Stage 7 — Dashboard `[x]`

- `app/(app)/page.tsx`, `DashboardGreeting` (time-of-day greeting; it is a client
  component, so decide props vs a namespace), `StatTile`, `NeedsAttentionCard`,
  `RecentApplicationsCard`.
- Use plurals for every count ("{count, plural, …}").

**Done (2026-10-11).** Notes:

- **Namespaces added, all server only:** `DashboardPage`, `StatTile`, `NeedsAttentionCard`
  and `RecentApplicationsCard`. `CLIENT_NAMESPACES` is unchanged.
- **`Greeting` takes props, not a namespace.** The page passes the three translated
  salutations (`salutations` prop), so the client leaf stays free of messages.
  `TodayDate` needed nothing beyond Stage 4's `useLocale()`.
- **Plurals:** the open-invites line is one ICU message (`<strong>` via `t.rich`), so the
  count, noun and verb agree in both languages. The "Application #{id} · Submitted <date>"
  line is also one message, with the date component slotted in by `t.rich`.
- **Reused:** the empty "No groups yet" card reads `GroupsPage`. `RecentApplicationsCard`
  became async to call `getTranslations`.
- **Still English until their stages:** `ApplicationStatusBadge` (Stage 8), `InviteStaffLink`
  and `AssignPendingRole` (Stage 10).
- **Verified in a browser:** the dashboard was clicked through in both languages, and the
  project owner reviewed the Spanish wording. Also checked by `pnpm lint`,
  `pnpm exec tsc --noEmit` and `pnpm build`.
- **Not verified at 390px:** Spanish stat labels such as "Pendientes de aprobar" are long.

### Stage 8 — Applications list `[x]`

- An `ApiErrors` namespace and a small helper that maps an `ApiError`'s HTTP status to a
  message, following "Errors from the APIs". It is reused by Stages 9–11.
- `applications/page.tsx`, `ApplicationsBrowser`, `StatusFilter`,
  `ApplicationsSummaryTable`, `ApplicationCardSummary`, `MembershipApplicationsList` and
  its skeleton.
- **Application status labels** become an `ApplicationStatus` namespace, keyed by the
  API's status value. `ApplicationStatusBadge` and `StatusFilter` both read it.

**Done (2026-10-11).** Notes:

- **Namespaces added:** `ApplicationStatus` and `ApplicationsBrowser` (client; the browser,
  filter, table and card share the latter), plus `ApplicationsPage` and `ApiErrors`
  (server only). The status badge calls `useTranslations`, so it works from server
  and client parents.
- **`ApiErrors` helper:** `getApiErrorMessage(error)` in `lib/api-error-message.ts`
  (server only) maps `ApiError.status` (404, 429, 503, else generic). Nothing calls it
  yet: list pages still throw to the error boundary. Stages 9–11 use it wherever they
  catch an `ApiError`.
- **Plural and rich text:** the live-region count is an ICU plural; "Application #{id} ·
  Submitted <date>" reuses the dashboard's `t.rich` approach.
- **Spanish wording (decided by the project owner):** "Fulfilled" is *Aprobada*; filter
  segments are *Todas / Pendientes / Aprobadas*. This matches the dashboard's "Pendientes
  de aprobar".
- `STATUS_FILTERS` now holds `labelKey`s instead of English labels.
- **Not verified in a browser or at 390px.** Checked by `pnpm lint`,
  `pnpm exec tsc --noEmit` and `pnpm build` only.

### Stage 9 — Application detail `[ ]`

- `applications/[id]/page.tsx`, `DetailCardHeading`, `TestimonyCard` (the headings only;
  the testimony text is user data), and `components/person_timeline` (event labels).

### Stage 10 — Users and My profile `[ ]`

- `users/page.tsx`, `UsersList`, `UsersSummaryTable`, `UserCardSummary`,
  `UserStatusChips`, `AssignPendingRole` (through Stage 5's error helper),
  `InviteStaffLink`, `users/me/page.tsx`.

### Stage 11 — Invites `[ ]`

- `users/invites/page.tsx`, `InvitesList`, `InvitesSummaryTable`, `InviteCardSummary`,
  `InviteStatusChips`, `invite-display.ts`, `NewInviteForm`, `CancelInviteButton`.

### Stage 12 — Wrap-up and optimisation `[ ]`

- **Audit for leftover English.** Grep `app/` and `components/` for JSX text and
  string `aria-label` / `placeholder` / `title` props that aren't `t(...)`. Optionally
  add `react/jsx-no-literals` (already available through `eslint-plugin-react`) as a
  *warning*, scoped to `app/` and `components/`, so new hard-coded strings get flagged.
- **Consider typed placeholders.** The plugin's `experimental.createMessagesDeclaration`
  generates types from `en.json`, so `t("trigger")` without its `{ name }` fails `tsc`.
- **Try precompiling.** Enable `experimental.messages.precompile` and compare the
  `pnpm build` client bundle sizes before and after. Keep it only if it builds cleanly and
  the saving is real. Record the numbers here either way.
- **Review `CLIENT_NAMESPACES`.** Anything that crept in and could be passed as props
  instead?
- **Docs.** Update CLAUDE.md: remove "preference only, no translations yet", and add a
  short "Adding UI text" section covering namespaces, server versus client,
  `CLIENT_NAMESPACES`, and the parity check. Add a closing note in
  `docs/design/ACCOUNT-MENU-AND-LANGUAGE.md`.

---

## Spanish wording (decided 2026-10-10)

1. **Who writes the Spanish:** Claude drafts `es.json` in each PR, and the project owner
   reviews the wording, church terms included, as part of the PR.
2. **Small groups:** use *grupo pequeño* / *grupos pequeños*, not *célula*. Small Group
   Leader → *Líder de grupo pequeño*.
3. **Form of address: *tú*.** Use it everywhere ("Inicia sesión", "Revisa tu correo"),
   never *usted*.
4. **"Default: your browser":** once someone picks a language, the menu can't go back
   to following the browser. That is accepted, so no "Browser default" option.

## Errors from the APIs (decided 2026-10-10)

The APIs stay English-only, and the staff app translates their errors. This is the
industry-standard split: an API returns a stable, machine-readable code, and the client
turns it into text in the user's language. Stripe's `code`, Google APIs' `reason`,
GraphQL's `extensions.code` and RFC 9457's `type` all follow it, and better-auth
exposes `error.code` / `$ERROR_CODES` for exactly this purpose.

Rules:

- **Map codes, never message text.** Matching on English strings breaks the moment
  the backend rewords them.
- **Always fall back** to a translated generic message for codes we don't know, so a
  new backend error never shows raw English or crashes the page.
- **Keep the backend's English message for logs.** It is for developers.

Per API:

- **auth-server (better-auth):** map `error.code` to an `AuthErrors` namespace (Stage 5).
- **membership-applications (FastAPI):** it returns English `detail` strings and no
  codes, but the staff app never shows them. `api/api-client.ts` keeps only the HTTP
  status. Map by status for now: 404 → not found, 429 → too many requests,
  503 → service unavailable, anything else → the generic message. If finer distinctions
  are needed later, add a `code` field next to `detail` in the API. That keeps the API
  language-agnostic.

**Out of scope: emails.** Verification, password-reset and invite emails are written
and sent by auth-server, so code mapping can't reach them. Translating them is a
separate plan.

## Open questions

None right now. If a stage finds backend text shown as-is (a free-text status, for
example), note it here and apply the rules in "Errors from the APIs".
