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
  namespace.
- Still English in the topbar: search, "Open menu", the home link's label and the role
  badge (Stage 2).

### Stage 2 — App shell and navigation `[ ]`

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

### Stage 3 — Shared components and error pages `[ ]`

- `EmptyState`, `ErrorState`, `ConfirmDialog` (default Confirm/Cancel labels),
  `components/data-table.tsx` ("Open" action, footer text such as "Showing 1–10 of 42",
  as an ICU message), `StatusBadge` (only if it holds fixed words), the skeletons'
  `aria-label`s, and `StaffAppPageHeader` / breadcrumbs ("Home", the `aria-label`).
- `app/error.tsx`, `app/(app)/error.tsx`, `app/(app)/loading.tsx`.
- Rule from the performance plan: server parents pass strings into client leaves where
  that is simpler than adding a client namespace.

### Stage 4 — Dates follow the selected language `[ ]`

Today `lib/format-date.ts` calls `Intl.DateTimeFormat(undefined, …)`, so dates follow
the *browser* language. A Spanish-browser user who picks English still sees Spanish
dates.

- Give the `formatLocal*` helpers a `locale` argument. `LocalFormattedDate` and the
  `Local*` wrappers read it with `useLocale()` (from `next-intl`) and pass it in.
- **Keep formatting after mount.** That part exists for the *time zone*: the server
  doesn't know the user's zone. Changing the language doesn't change that.
- Check numbers too (stat tiles, counts), and use `Intl.NumberFormat(locale)` or
  `useFormatter()` where numbers are shown.

### Stage 5 — Auth pages, part 1: sign-in, sign-up, password reset `[ ]`

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

### Stage 6 — Auth pages, part 2: verification, pending role, invites `[ ]`

- `needs-verification` (and `ResendVerificationButton`), `needs-role`, and
  `accept-invite` (`accept-invite-client.tsx`, including its "invalid or expired" states).
- Reuses Stage 5's error helper.

### Stage 7 — Dashboard `[ ]`

- `app/(app)/page.tsx`, `DashboardGreeting` (time-of-day greeting; it is a client
  component, so decide props vs a namespace), `StatTile`, `NeedsAttentionCard`,
  `RecentApplicationsCard`.
- Use plurals for every count ("{count, plural, …}").

### Stage 8 — Applications list `[ ]`

- An `ApiErrors` namespace and a small helper that maps an `ApiError`'s HTTP status to a
  message, following "Errors from the APIs". It is reused by Stages 9–11.
- `applications/page.tsx`, `ApplicationsBrowser`, `StatusFilter`,
  `ApplicationsSummaryTable`, `ApplicationCardSummary`, `MembershipApplicationsList` and
  its skeleton.
- **Application status labels** become an `ApplicationStatus` namespace, keyed by the
  API's status value. `ApplicationStatusBadge` and `StatusFilter` both read it.

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
