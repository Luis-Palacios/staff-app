# Auth Integration Roadmap

Working doc for wiring authentication/authorization across the three sibling repos
(`auth-server`, `membership-applications`, `staff-app`) — kept as three separate repos/services
(eventually three separate Docker containers), not merged. Going through this slowly, one phase
at a time, as a learning exercise, not a race to "done." Pick up at whichever phase is still
marked `[ ]`.

## Architecture decided (see discussion below for the reasoning)

- **auth-server** stays the single source of identity/roles. Browser sign-in talks to it via
  better-auth sessions; other services never see passwords or manage their own user tables.
- **staff-app is a BFF (backend-for-frontend).** The browser never calls `membership-applications`
  directly (confirmed: `lib/env.ts`'s `APPLICATIONS_MEMBERSHIP_API_URL` has no `NEXT_PUBLIC_`
  prefix, so it's already server-only). It also won't call `auth-server` cross-origin from the
  browser — instead:
  - `staff-app` reverse-proxies `/api/auth/*` to `auth-server`'s `/api/auth/*` (Next.js
    `rewrites()`). The browser only ever talks to its own origin, so better-auth's `Set-Cookie`
    lands as a same-origin, host-only cookie on `staff-app`'s domain. No CORS dance, no
    `SameSite=None`, no shared parent domain — and it's domain-agnostic for whatever the eventual
    Docker/deployment topology looks like.
  - Because the cookie is now `staff-app`'s own, Next.js middleware/Server Components can read it
    directly for route protection — no manual cookie-forwarding hacks needed for *that* part.
- **`staff-app` → `membership-applications` uses JWT, not the cookie.** Server-side code in
  `staff-app` forwards the incoming session cookie to `auth-server`'s token endpoint (server-to-
  server, not a browser fetch — this part still works even without the proxy) to mint a
  short-lived JWT, then calls `membership-applications` with `Authorization: Bearer <jwt>`.
  `membership-applications` verifies the JWT against `auth-server`'s JWKS
  (`/.well-known/jwks.json`) — fully stateless, never sees a cookie. This matches its CORS
  middleware already being set to `allow_credentials=False`.
- **Sign-up stays admin-provisioned for now.** No public sign-up form until Phase 6 (user
  management) exists. This also means Phase 1 below, while still worth doing early because it's
  cheap and easy to forget later, isn't a hard blocker on shipping sign-in.
- **UI: raw `authClient` first, `better-auth-ui[heroui]` later** (Phase 8) — learn the actual
  session/JWT mechanics before adding a UI library on top of them. `better-auth-ui` only renders
  forms and exposes the same client hooks; it doesn't touch authorization/routing logic, so
  swapping it in later doesn't conflict with anything built in earlier phases.
- **Role vs permission, and who checks what.** better-auth's `admin` plugin puts `role` (a plain
  string) directly on `session.user` — that's available to `staff-app` the moment a session
  exists, no JWT involved. "Permission" (the per-resource CRUD grants in `statements.ts`) is not
  per-user data — it's *computed* from `role + the statements.ts definitions`. So:
  - `staff-app`'s own UI gating (nav menu in `config/site.ts`, route access) is driven by the
    **session's role** (Phase 9), independent of the JWT entirely.
  - `membership-applications` has no session — the JWT is its only signal. The `jwt` plugin's
    payload is customized to include just the `role` claim (small, stable token — the standard
    "claims-based authorization" pattern, e.g. how Auth0/Okta/Cognito hand off `roles`/`groups`)
    rather than a precomputed permission set, so the token doesn't have to change shape every time
    `statements.ts` does (Phase 4). `membership-applications` verifies the JWT itself (Phase 5),
    then computes role→permission from a small Python port of the same mapping (Phase 9) — a
    deliberate, reviewed duplication, not synced automatically, acceptable at the current scale
    (4 roles, 4 custom resources).
  - Tradeoff accepted: a role change takes effect on `membership-applications` only once a new JWT
    is minted (bounded by the token's expiry), not instantly — the alternative (FastAPI calling
    back to `auth-server` per request) would keep it live but defeats stateless JWT verification
    and couples FastAPI's uptime to `auth-server`'s, so it's explicitly not the default here.

## Working process for every phase

This is a learning exercise, not a race to "done" — so each phase is worked in two steps, not
implemented in one shot:

1. **Plan the phase first.** Before touching code, talk through what the phase actually involves
   for real (files touched, endpoints/paths to verify, decisions to make) and agree on the
   approach.
2. **Apply it piece by piece, explained as we go.** Once a phase is planned, each part of the
   flow/each code change is shown and explained individually as it's made — not dropped in as one
   big diff — so the reasoning behind each step is clear before moving to the next one.

## How to use this doc

Each phase has:
- **Repo(s)** — which of the three this phase touches.
- **What** — the concrete change.
- **Why** — the failure mode it prevents or the capability it unlocks.
- **New concepts** — what you'll learn doing it.
- **New env vars** — what gets added to which `.env.example`.

Status markers: `[ ]` not started, `[~]` in progress, `[x]` done.

---

## Phase 1 — Fix the default-role permission gap
`[x]`

**Repo(s):** `auth-server`

**What:** In `src/permissions/statements.ts`, `user` is currently defined as
`accessControl.newRole({ ...statement })` — the full, unrestricted statement object, i.e. full
`create/view/update/delete` on `persons`, `membershipApplications`, `smallGroups`, and
`smallGroupsReport`. Since better-auth's `admin` plugin assigns a default role to every new
account and that default is `"user"`, anyone created without an explicit role currently gets
near-admin access. Introduce a genuinely restricted role (e.g. `pending`, with no statements, or
only `view` on nothing) and point the admin plugin's `defaultRole` at it instead of `"user"`, or
repurpose `"user"` itself to mean "no access yet" and rename the current unrestricted one to
something explicit like `staff`. Update: went with a new `pending` role (`accessControl.newRole({})`
— no statements spread in, so it inherits nothing), registered it in `adminPlugin`'s `roles`, and
set `defaultRole: 'pending'`. Verified live: signed up a throwaway account against a running
`auth-server`, confirmed `role: "pending"` on the sign-up response, the sign-in response, and
`get-session`, confirmed the existing `admin` account was unaffected, then deleted the test
account.

**Why:** This is the gap you were worried about when you mentioned not wanting signups to land
on an app with real access. It's cheap to fix now and a landmine if left until sign-up (Phase 7)
actually ships.

**New concepts:** how better-auth's `admin` plugin picks a default role for new accounts
(`defaultRole` option), the difference between "a role exists" and "a role is reachable by an
unauthenticated signup."

**New env vars:** none.

---

## Phase 2 — staff-app signs in via the raw `authClient`
`[x]`

**Repo(s):** `staff-app` (reads from `auth-server`, no `auth-server` changes expected)

**What:** Add better-auth's client package to `staff-app`, point it at `auth-server`'s URL
directly (not yet proxied), build a bare sign-in form (email/password only — the admin account
you already created), and get a working session: `useSession()`/`getSession()` returning the
logged-in user. No route protection yet, no JWT yet — just prove the session round-trip works
end-to-end across the two services.

**Why:** Isolates "does the session cookie round-trip work at all" from every other moving part
(proxying, middleware, JWT) so failures are easy to localize.

**New concepts:** better-auth's client/server split, what a session cookie actually contains,
CORS + `credentials: "include"` for a direct cross-origin call (this phase still calls
`auth-server` directly, before the proxy replaces it in Phase 3).

**New env vars:** `staff-app/.env.example`: `NEXT_PUBLIC_AUTH_SERVER_URL` (public, browser-
reachable — `http://localhost:5000` in dev; the `NEXT_PUBLIC_` prefix is required since this is
read from browser-side code, and it has to be a literal `process.env.NEXT_PUBLIC_...` expression
rather than routed through `lib/env.ts`'s `requireEnv`, since Next only statically inlines the
literal form into the client bundle).

Update: added `better-auth@^1.7.2` (matching auth-server's pin) as a dependency;
`lib/auth-client.ts` exports a singleton `authClient` (`createAuthClient` from `better-auth/react`,
with the `adminClient()` plugin registered — mirrors the `admin` plugin configured server-side, so
`session.user.role` is properly typed rather than an untyped field, and admin-only client methods
used later in Phase 6 are available); `app/sign-in/page.tsx` is a deliberately bare (plain HTML,
no HeroUI) client component proving the round-trip: email/password form → `authClient.signIn.email`,
`authClient.useSession()` to display who's signed in, sign-out button. Verified live: signed in
and out with the admin account through the actual page in a browser — confirmed working. Verified
CORS mechanics separately via `curl` with `Origin: http://localhost:3000` — the browser's
cross-origin request is correctly allowed with credentials.

Why an explicit absolute `baseURL` was needed at all (verified in `better-auth`'s own
`dist/client/config.mjs`): if `baseURL` is omitted, the client resolves it in this order —
(1) the `NEXT_PUBLIC_AUTH_URL` env var, a name better-auth auto-detects as a convenience,
(2) a same-origin server-side fallback (`NEXTAUTH_URL`/`VERCEL_URL`, not relevant here), (3) the
literal relative string `"/api/auth"`. That fallback means better-auth's own default assumption
is *same-origin* — exactly the proxied setup Phase 3 builds. We're not on that path yet, so
leaving `baseURL` unset would have made the client call `http://localhost:3000/api/auth/...`
(staff-app's own origin, nothing mounted there → 404). This has nothing to do with better-auth
requiring a direct browser call — the fetch merely executes in the browser because `authClient`
is used inside a `"use client"` component, and whatever URL it's given has to already be in the
browser bundle, which is what forces `NEXT_PUBLIC_`. Once Phase 3's proxy exists, `baseURL` can
be dropped entirely (not just swapped for a different var) and the `"/api/auth"` relative
default will correctly hit staff-app's own origin, which the rewrite then relays server-side —
so `NEXT_PUBLIC_AUTH_SERVER_URL` stops being something the browser needs at all, not just
something that moves.

Known, deliberate loose end: the sign-in page still renders inside the full dashboard shell
(sidebar/topbar) since `app/layout.tsx` wraps everything in `<AppShell>` unconditionally — no
route-group split between public/authenticated pages exists yet. Left as-is on purpose; Phase 3.2
introduces middleware-based route protection, and restructuring the layout (e.g. an `(auth)` vs
`(app)` route group) belongs with that work rather than being done twice.

---

## Phase 3 — Reverse-proxy `/api/auth/*` + route protection
`[x]`

**Repo(s):** `staff-app`

**What:** Add a `rewrites()` entry in `next.config.mjs` forwarding `/api/auth/:path*` to
`auth-server`'s `/api/auth/:path*` (destination built from `NEXT_PUBLIC_AUTH_SERVER_URL`, reused
server-side here — see New env vars below), and simplify `lib/auth-client.ts` by dropping the
`baseURL` option entirely — see Phase 2's notes on why better-auth's own relative-path default
(`"/api/auth"`) then does the right thing automatically, no env var needed by the browser at all.
Verify the cookie now shows up as same-origin (check
dev tools: `Domain` should be unset/host-only, not `auth-server`'s host).

Update: `next.config.mjs` reads `process.env.NEXT_PUBLIC_AUTH_SERVER_URL` directly (not through
`lib/env/client.ts`'s zod schema) since this file is loaded by Node before Next's TS/bundler
pipeline exists, so it can't import a `.ts` module. Dropping `baseURL` from `lib/auth-client.ts`
left `lib/env/client.ts` with no remaining callers (it existed solely to validate that one
browser-side var), so it was deleted outright rather than kept around unused —
`lib/env/server.ts` and `lib/env/format-error.ts` are untouched and still in use. Verified live:
started both `auth-server` and `staff-app`, then `curl -D -` a sign-in request straight at
`staff-app`'s own origin (`localhost:3000/api/auth/sign-in/email`) — got back a real `200` with
the actual admin user record (email/role from the database), which `staff-app` has no way to
produce itself, confirming the request was genuinely forwarded to and answered by `auth-server`.
The response's `Set-Cookie` header carries no `Domain` attribute
(`better-auth.session_token=...; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax`), so a browser
receiving it from `localhost:3000` scopes it host-only to `staff-app`'s own origin, not
`auth-server`'s — the same-origin cookie goal this phase was after. (Browser extension wasn't
connected this session, so this was verified via `curl` rather than an actual browser's
dev tools — worth a quick manual double-check in-browser next time it's convenient, though the
`Set-Cookie` header inspected here is exactly what the browser would have parsed.)

**Why:** This is the "same domain" trick you were reading about, minus the deployment
constraint of putting everything under one apex domain. Confirms the whole cookie story works
before building anything on top of it.

**New concepts:** Next.js `rewrites()` as a reverse proxy, how `Set-Cookie` passes through a
proxy hop.

**New env vars:** none new. `NEXT_PUBLIC_AUTH_SERVER_URL` (from Phase 2) is kept and reused as the
`rewrites()` destination — even though the browser stops needing it directly once `baseURL` is
dropped, we're deliberately not introducing a separate server-only var (e.g.
`AUTH_SERVER_INTERNAL_URL`) just for that; Next.js can read a `NEXT_PUBLIC_`-prefixed var from
server-side code the same as any other env var.

---

## Phase 3.2 — Route protection & public/authenticated layout split
`[x]`

**Repo(s):** `staff-app`

**What:** Add Next.js middleware that reads the session and redirects unauthenticated users away
from protected routes. Also restructure routing so `/sign-in` (and any other public page) isn't
wrapped in `<AppShell>` — e.g. an `(auth)` route group with its own plain layout alongside an
`(app)` group that keeps the current `AppShell`-wrapped `app/layout.tsx` behavior (deferred here
from Phase 2 on purpose, see its notes above).

**Why:** This is the actual authentication gate — without it, an unauthenticated visitor can
still reach protected pages regardless of whether the same-origin cookie from Phase 3 exists.
Splitting the layout also finally resolves the loose end noted in Phase 2 (the sign-in page
rendering inside the full dashboard shell).

Update: implemented as two layers, deliberately. `proxy.ts` (root — not `middleware.ts`;
Next 16.2.6 detects `middleware.ts` but logs a deprecation warning pointing at `proxy.ts`,
verified in `next/dist/build/index.js` and its loader template, which resolves the handler as
`mod.proxy` for a file named `proxy.*` — same mechanism, just a renamed file/export) uses
better-auth's `getSessionCookie` (`better-auth/cookies`) for a cheap, Edge-safe *optimistic*
check: cookie present + `/sign-in` → redirect to `/`; cookie absent + protected route → redirect
to `/sign-in`. `config.matcher` excludes `/api/*` (so the Phase 3 proxy is never intercepted),
Next internals, and static files. This check can't verify the cookie is still valid (expired/
revoked), so it's paired with an authoritative check in `app/(app)/layout.tsx` (an async Server
Component) that calls a new `getServerSession()` helper and `redirect("/sign-in")` if it returns
null.

`getServerSession()` (`lib/get-server-session.ts`) deliberately does *not* reuse
`authClient.getSession()` from `lib/auth-client.ts` — traced through
`better-auth/dist/client/config.mjs` and `utils/url.mjs`: the client's `baseURL` resolution never
receives a `request` object from `getClientConfig` (hardcoded `void 0`), so with no
`BETTER_AUTH_URL`/`NEXT_PUBLIC_BETTER_AUTH_URL`/etc. env vars set it falls all the way back to the
literal relative string `"/api/auth"` — fine in the browser (resolves against
`window.location`), but Node's `fetch` has no document to anchor a relative URL against and would
throw. `authClient` is also a module-level singleton whose session state lives in nanostore atoms
at that same scope — reused correctly for one browser tab, but the wrong shape for a per-request
server-side read across concurrent requests in one Node process. So instead: new
`api/auth-api/{client.ts,types.ts}`, mirroring `api/applications-membership-api`'s existing
pattern exactly (a plain fetch client, `BASE_URL` from `env`, no Next-specific APIs) — its
`getSession(cookie)` calls `auth-server`'s `/api/auth/get-session` directly (server-to-server,
bypassing the Phase 3 proxy, which exists for the browser's same-origin cookie, not for this).
Confirmed by reading `better-auth/dist/api/routes/session.mjs` that this endpoint always answers
`200` — `null` body when there's no valid session, `{ session, user }` otherwise — so `apiFetch`
(which throws on `!response.ok`) only throws for genuine failures (auth-server down/5xx), never
for "not signed in." `lib/get-server-session.ts` is the thin Next-specific glue on top: reads the
incoming request's `cookie` header via `next/headers`' `headers()` and calls the client.
`AuthRole`/`AuthSessionUser`/`AuthSession` in `api/auth-api/types.ts` mirror the role set from
`auth-server/src/lib/auth.ts`'s `adminPlugin({ roles: {...} })` (`admin`, `user`,
`smallGroupLeader`, `deacon`, `pending`, `elder`) — same hand-maintained-duplication tradeoff
already described above for Phase 5. `NEXT_PUBLIC_AUTH_SERVER_URL` was added to
`lib/env/server.ts`'s zod schema (same var from Phase 2/3, not a new one) so this client validates
it the same way `APPLICATIONS_MEMBERSHIP_API_URL` already does, rather than reading
`process.env` raw.

Route groups: `app/(app)/layout.tsx` (new) does the authoritative check above and renders
`<AppShell>{children}</AppShell>`; `app/(auth)/layout.tsx` (new) is a plain centered wrapper.
`app/page.tsx`, `app/applications/**`, `app/groups/**`, and `app/users/page.tsx` moved (via
`git mv`) under `app/(app)/`; `app/sign-in/page.tsx` moved under `app/(auth)/`. Route groups don't
change URLs, so `/`, `/applications`, `/groups`, `/users`, `/sign-in` are unaffected. Root
`app/layout.tsx` no longer wraps children in `<AppShell>` — that's now each group layout's job.
`app/error.tsx` stayed at the root (route groups don't add an error-boundary segment, so it still
covers both). Also closed a small gap noticed while wiring this up: `app/(auth)/sign-in/page.tsx`
didn't redirect anywhere after a successful sign-in (you'd just sit on `/sign-in` seeing "Signed in
as…" until navigating away manually) — added `router.push("/")` on success.

Verified: `pnpm lint`, `npx tsc --noEmit`, and `next build` all clean (`next build`'s route table
confirms `proxy.ts` is picked up as `ƒ Proxy (Middleware)`). Then live, with `auth-server` (`bun
src/index.ts`) and `staff-app` (`pnpm dev`) both running against the real Postgres instance: signed
up a throwaway account (confirmed `role: "pending"`, per Phase 1), signed in through the `/api/auth`
proxy, and via `curl` confirmed all four cases — unauthenticated `/` → `307` to `/sign-in`;
authenticated `/sign-in` → `307` to `/`; authenticated `/` → `200` and contains the `AppShell`'s
`<aside>` sidebar markup; unauthenticated `/sign-in` → no `<aside>` markup anywhere in the response.
Deleted the throwaway account afterward — directly via the database, since better-auth's
self-service `delete-user` endpoint isn't enabled in `auth-server`'s config (404'd when tried).
Browser extension wasn't connected this session, so — same caveat as Phase 3 — this was verified
via `curl` rather than an actual browser's dev tools; worth a quick manual double-check in-browser
next time it's convenient.

**New concepts:** Next.js middleware for auth gating, reading a session in Server Components vs
Client Components, structuring route groups for public vs authenticated layouts.

**New env vars:** none.

---

## Phase 3.5 — Logout & basic user info in the topbar
`[x]`

**Repo(s):** `staff-app`

**What:** The topbar's avatar is currently a hardcoded `SA` fallback with no menu — there's no way
to sign out from the UI at all (only via the bare sign-out button on the Phase 2 sign-in-page stub,
which requires already being on that page). Wire up the goal shown in
`components/topbar.tsx`'s avatar: clicking it opens a menu with "Signed in as `<email>`", "My
Profile" (→ `/users/me`, which already exists as a stub page), and "Logout".

Decided while planning this phase:
- **How the current user's data reaches `Topbar`:** not a prop threaded through `AppShell` (which
  has no other reason to know about `user`, and it'd repeat for every future component that needs
  it, e.g. `Sidebar` in Phase 9). Instead, a small client-side React Context
  (`lib/user-context.tsx`): a `UserProvider` seeded once in `app/(app)/layout.tsx` from the
  `getServerSession()` call already made there for the auth redirect check, and a `useCurrentUser()`
  hook any descendant client component (`Topbar` now, `Sidebar` later) can call directly. One seam
  at the root instead of drilling, and no second/redundant client-side session fetch (vs. calling
  `authClient.useSession()` again inside `Topbar`).
- **Menu component:** HeroUI's `Dropdown` compound component (`Dropdown.Root/Trigger/Popover/
  Menu/Item`, built on `react-aria-components`' `Menu`) — same compound-component pattern already
  used elsewhere (`Disclosure` in `sidebar.tsx`, `TextField`/`InputGroup` in `topbar.tsx`).
  `Dropdown.Item` supports `href` directly (so "My Profile" needs no click handler) and a
  `variant="danger"` (so "Logout" gets the red styling from the goal screenshot with no custom
  CSS).
- **Logout redirect:** `authClient.signOut()` followed by `router.push("/sign-in")`. The Phase 2
  sign-in-page stub calls `signOut()` with no redirect (fine there, since you're already on
  `/sign-in`), but the topbar is reachable from every protected page, so without an explicit
  redirect the current page would stay mounted (with now-stale/unauthorized data) until the next
  navigation.
- **Avatar initials:** derived from `user.name` instead of the hardcoded `"SA"`.
- **Role:** deliberately not shown in this menu — `user.role` is available on the session already,
  but surfacing it is part of Phase 9's role-based UI work, not this phase.

**Why:** Closes an actual gap (no sign-out path in the UI) and replaces the hardcoded avatar
placeholder with real session data — both self-contained UI changes that don't depend on
role-based nav (deferred to Phase 9) or the JWT bridge (Phase 4).

**New concepts:** React Context as the App Router idiom for handing server-fetched data down to
an arbitrary depth of client components without prop drilling or a redundant fetch; HeroUI's
`Dropdown` compound component.

**New env vars:** none.

---

## Phase 4 — JWT bridge from staff-app to membership-applications
`[x]`

**Repo(s):** `auth-server` (JWT payload customization) + `staff-app` (reads `auth-server`'s token
endpoint + JWKS path — verify exact routes empirically, don't assume)

**What:** In `auth-server`, customize the `jwt` plugin's payload to include the `role` claim (role
only — not a precomputed permission set, see the "Role vs permission" note above; confirm the
exact payload-customization option's name/shape in the `jwt` plugin's config once we're here,
don't assume). In `staff-app`, add a server-side helper (used from Route Handlers/Server Actions)
that forwards the incoming request's session cookie to `auth-server`'s JWT-plugin token endpoint,
gets back the short-lived JWT, and attaches it as `Authorization: Bearer <jwt>` on calls made
through `lib/api-client.ts`. Confirm the actual mounted paths for the token endpoint and
`/.well-known/jwks.json` by hitting them directly first (the `jwt` plugin is configured with
`disableSettingJwtHeader: true` and a custom `jwksPath`, so don't assume the untouched defaults).

**Why:** This is the actual "session for the UI, JWT for the API" bridge — the piece your
original question was about. Putting `role` in the claims (rather than a full permission set)
keeps the token small and means its shape doesn't need to change every time `statements.ts` does.

**New concepts:** how better-auth's `jwt` plugin mints a token from an existing session and how
to customize its payload, JWKS/JWT signature verification basics, short-lived-token tradeoffs
(mint-per-request vs cache until near expiry, and the staleness window a `role` claim implies).

**New env vars:** none new in `staff-app` (reuses `NEXT_PUBLIC_AUTH_SERVER_URL`).

Update: traced the actual mounted routes from `better-auth`'s own plugin source
(`dist/plugins/jwt/index.mjs`, `sign.mjs`) rather than assuming — token endpoint is
`GET /api/auth/token` (session-gated via `sessionMiddleware`, same cookie-forwarding shape as
Phase 3.2's `get-session` call), payload customization is the `jwt.definePayload(session)` option
(receives `{ user, session }`, returns the custom claims; `sub`/`iat`/`exp`/`iss`/`aud` are set by
better-auth itself regardless of what this returns). Verified live *before* touching any code: with
no `definePayload` set, `/api/auth/token` was already minting a JWT containing better-auth's
default payload — the *entire* `user` row (name, email, `emailVerified`, `banned`/`banReason`/
`banExpires`, timestamps). Nothing consumed this token yet (Phase 5 doesn't exist), but it was a
concrete, live example of the exact over-broad-claims problem this phase exists to prevent.

`auth-server/src/lib/auth.ts`: added `jwt: { definePayload: ({ user }) => ({ role: user.role }) }`
to the existing `jwt({...})` plugin call. `staff-app`: `api/auth-api/types.ts` gained a small
`AuthToken { token: string }` type; `api/auth-api/client.ts` gained `getToken(cookie)` calling
`GET /api/auth/token` with the forwarded cookie header (mirrors `getSession` exactly, except this
endpoint throws rather than returning `null` for "no session" — confirmed via
`sessionMiddleware`'s behavior in the plugin source); `lib/get-auth-token.ts` (new) reads the
incoming request's cookie via `next/headers` and calls it, returning `null` only when there's no
cookie at all (mirrors `get-server-session.ts`'s shape) — deliberately lets a mid-session-expiry
or `auth-server`-outage error propagate as a thrown `ApiError` rather than swallowing it to `null`,
since every call site sits inside `app/(app)/layout.tsx`, which already guarantees a valid session
exists via Phase 3.2's redirect-to-`/sign-in` check, so a throw here can only mean a genuine race
or failure, not "not signed in."

Rather than repeating `const token = await getAuthToken()` + the `Authorization` header at every
call site, added `lib/authenticated-fetch.ts` — a thin `authenticatedFetch<T>(baseUrl, path,
options)` wrapper composing `apiFetch` (`lib/api-client.ts`) and `getAuthToken()`, attaching
`Authorization: Bearer <token>` and spreading any caller-supplied `options.headers` last so they
can still override it (same override-friendly composition `apiFetch` itself already uses for
`Accept`/`Content-Type`). Deliberately not folded into `apiFetch` itself or `get-auth-token.ts`:
`apiFetch` is also used by `api/auth-api/client.ts` for cookie-forwarding calls
(`getSession`/`getToken`) that must never get a JWT attached, and `get-auth-token.ts` already
imports from `api/auth-api/client.ts` — putting the wrapper in `api-client.ts` would create
`api-client.ts` → `get-auth-token.ts` → `auth-api/client.ts` → `api-client.ts`, a circular import.
`api/applications-membership-api/client.ts`'s `getRecentApplications`/`getApplicationDetail` were
the only two existing call sites; both now go through `authenticatedFetch` instead of `apiFetch`
directly, and dropped back to non-`async` (just returning the wrapper's promise) since it owns the
`await` internally.

No caching: a fresh JWT (15m expiry, `auth-server`'s `jwt` plugin default) is minted on every
single call to `membership-applications`, even multiple calls in the same request. Deliberate for
now — see the new Phase 10 below, added specifically to revisit this once it's worth the added
complexity.

Verified live in three steps, each confirming a different link in the chain: (1) decoded the
token from `/api/auth/token` before the `definePayload` change — confirmed the full-user-row leak
described above; (2) restarted `auth-server`, decoded the token again — confirmed the payload was
now exactly `{ role, sub, iat, exp, iss, aud }`; (3) to confirm the header actually reaches
`membership-applications` (not just that the page renders — `membership-applications` doesn't
verify JWTs yet, so a working page proves nothing about the header being present or correct),
temporarily overrode `staff-app`'s `APPLICATIONS_MEMBERSHIP_API_URL` (via a shell env var, not the
`.env.local` file) to point at a throwaway local Node script that only echoes the headers of any
request it receives, then loaded `/applications` in a real signed-in browser session and read the
captured request: `GET /applications/recents` with `authorization: "Bearer <jwt>"`, the JWT
decoding to the same role-only payload from step 2. Reverted the override and restarted `staff-app`
normally immediately after. Also reran `pnpm exec tsc --noEmit` (both repos), `pnpm lint`
(`staff-app`), and `pnpm exec biome check` (`auth-server`) after each of the five changes — all
clean (the one `biome check` failure encountered was 9 pre-existing formatting errors in
`tsconfig.json`, unrelated to this phase's files).

---

## Phase 5 — membership-applications verifies the JWT
`[ ]`

**Repo(s):** `membership-applications`

**What:** Add a JWT-verification dependency (new dependency needed — e.g. `python-jose` or
`PyJWT`, plus a JWKS client with caching so it's not fetching the JWKS on every request) that
validates the `Authorization: Bearer` header against `auth-server`'s JWKS — signature, expiry,
issuer/audience — and rejects requests with a missing/invalid/expired token. Expose the decoded
claims (including the `role` claim set in Phase 4) to route handlers via a FastAPI dependency, but
stop there: no role→permission mapping, no per-route gating by role yet. That's authorization, not
authentication, and it's deliberately deferred to Phase 9, where it's designed alongside
`staff-app`'s own role-based gating instead of in isolation.

**Why:** Right now `membership-applications` trusts every request unconditionally — this closes
that by requiring a genuinely valid JWT before anything else happens. Keeping this phase to
authentication only (not also authorization) keeps it small and testable in isolation: "does a
bad/missing/expired token get rejected" is a clean yes/no, whereas "does this role get to do this"
pulls in a whole mapping design that deserves its own phase (Phase 9).

**New concepts:** FastAPI dependencies for auth (`Depends(...)`), verifying a JWT against a JWKS
endpoint (vs a shared secret), caching a JWKS fetch so verification doesn't hit the network per
request.

**New env vars:** `membership-applications/.env.example`: `AUTH_SERVER_JWKS_URL` (or equivalent —
however Phase 4's investigation resolves the actual path).

---

## Phase 6 — User management UI (admin only)
`[ ]`

**Repo(s):** `staff-app` (reads/writes via `auth-server`'s admin-plugin endpoints, no
`auth-server` code changes expected)

**What:** An admin-only section in `staff-app` to list users and assign one of the roles from
`statements.ts` (`admin`, `smallGroupLeader`, `deacon`, plus whatever Phase 1 introduces),
using better-auth's admin-plugin client methods (`listUsers`, `setRole`, etc.) through the
Phase 3 proxy. Gated by the same middleware (Phase 3.2) and role check (Phase 3.5) built earlier.

**Why:** This is what makes admin-provisioned accounts (the Phase 0 decision) practical day to
day, and it's the prerequisite for safely enabling sign-up in Phase 7.

**New concepts:** better-auth's admin-plugin client API surface, building a role-gated page
(not just an authenticated-gated one).

**New env vars:** none new.

---

## Phase 7 — Enable sign-up
`[ ]`

**Repo(s):** `staff-app` (+ confirm `auth-server`'s `emailAndPassword`/signup config is what you
want — e.g. email verification)

**What:** Add the sign-up form. Safe now because Phase 1 means new accounts land with no access,
and Phase 6 means an admin has a UI to promote them.

**Why:** Sequencing — this was explicitly deferred until the pieces that make it safe exist.

**New concepts:** whatever's left from better-auth's sign-up flow not already covered (e.g. email
verification, if you turn it on).

**New env vars:** TBD depending on whether email verification is enabled (would need an email
provider).

---

## Phase 8 — Swap in better-auth-ui[heroui]
`[ ]`

**Repo(s):** `staff-app`

**What:** Replace the hand-rolled forms from Phases 2/7 with `better-auth-ui[heroui]`, wired to
the same `authClient` instance. Authorization/routing logic (middleware, role gates) is untouched
— only the form rendering changes.

**Why:** Faster iteration on UI polish once the underlying mechanics are understood and already
working, so a UI-library bug can't be confused with an auth-mechanics bug.

**New concepts:** `better-auth-ui`'s API surface, how far its theming/customization goes with
HeroUI v3.

**New env vars:** none expected.

---

## Phase 9 — Role-based nav & route gating
`[ ]`

**Repo(s):** `staff-app` + `membership-applications`

**What:** Two role→permission mappings, designed together since they're the same underlying
model expressed twice (see the "Role vs permission" architecture note above):
- `staff-app`: now that `session.user.role` is reliably available server-side (via Phase 3.2's
  middleware/Server Components) and, since Phase 3.5, available to client components too via
  `useCurrentUser()`, filter `config/site.ts`'s `navItems` (and gate the matching routes) by
  role — decide the role→visible-nav-items mapping together when we plan this phase, and decide
  where that mapping lives (e.g. alongside `siteConfig` vs a dedicated `lib/permissions.ts`).
- `membership-applications`: now that Phase 5 verifies the JWT and exposes its decoded claims
  (including `role`) to route handlers, write a small Python port of the relevant parts of
  `statements.ts` (a role→permission mapping, e.g. a dict/enum — deliberately hand-maintained,
  reviewed together whenever `statements.ts` changes, not auto-synced) and use it to gate the
  `applications` and `people` routers per-route, not just "is there a valid role."

**Why:** Answers the original question about `site.ts` directly — it only needs the session, not
the JWT. Also picks up the authorization half of what Phase 5 originally scoped in — deliberately
split out so `membership-applications`' role→permission mapping gets designed alongside
`staff-app`'s nav mapping instead of being worked out in isolation and revisited later. Kept as
its own phase, separate from Phase 3's proxy work and Phase 3.2's middleware/route-group plumbing
and from Phase 5's JWT verification, since "is there a session/valid token" and "what does this
role allow" are different questions with different failure modes. Deliberately scheduled last —
moved out of its original slot right after Phase 3.2 once it became clear the role→permission
model needs more thought than a quick pass between other phases.

**New concepts:** deriving UI visibility from `role` without a network call, designing a
role→visible-nav-items mapping and deciding where that mapping should live, deliberately
duplicating a small piece of authorization logic across two languages (TypeScript's
`statements.ts` and a Python port) as a maintained contract rather than a shared library.

**New env vars:** none (membership-applications' `AUTH_SERVER_JWKS_URL` was already added in
Phase 5).

---

## Phase 10 — Cache the minted JWT until near expiry
`[ ]`

**Repo(s):** `staff-app`

**What:** Phase 4's `lib/authenticated-fetch.ts` mints a brand-new JWT (via `getAuthToken()` →
`auth-server`'s `GET /api/auth/token`) on *every* call to `membership-applications`, including
multiple calls within the same incoming request. Add a cache in front of that — scoped per
request at minimum (e.g. React's `cache()` so concurrent calls in one render dedupe into a single
mint), and decide whether to go further with a short-lived cross-request cache keyed by session
(bounded by the token's own expiry, so a cached token is never served past its `exp`).

**Why:** Deferred deliberately during Phase 4 rather than built speculatively — at the time there
were only two call sites (`getRecentApplications`, `getApplicationDetail`), each issuing at most
one `membership-applications` call per request, so there was nothing to dedupe yet and no measured
cost to justify the complexity. Revisit once either (a) a single request starts making multiple
`membership-applications` calls, or (b) the per-request round-trip to `auth-server` for a token
becomes a measured latency cost worth removing.

**New concepts:** request-scoped memoization in React Server Components (`cache()` from `react`),
the tradeoff between a cached token's staleness window and the round-trip cost of minting fresh
every time — same tradeoff already flagged as a "new concept" back in Phase 4.

**New env vars:** none expected.

---

## Later / stretch (not yet scheduled)

- **Full permission-granularity enforcement in FastAPI** — Phase 9 starts with role checks;
  decide later whether to mirror `statements.ts`'s per-resource CRUD statements exactly.
- **Dockerizing all three** — each repo containerized, plus whatever local dev story (e.g.
  docker-compose) makes running all three together easy. Explicitly out of scope for this doc
  beyond noting that the reverse-proxy approach (Phase 3) and internal-URL env vars (Phase 3/4)
  were chosen to not paint this into a corner.
- **JWKS caching/rotation behavior** — worth a closer look once Phase 5 is live and there's
  actual traffic to observe.

---

## Suggested order

1 → 2 → 3 → 3.2 → 3.5 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Reasoning: fix the cheap-but-important
permission gap first (1), then build the session round-trip in the smallest possible slice (2)
before adding the proxy on top of it (3), then add route protection and the public/authenticated
layout split (3.2), then close the logout gap and get real session data into the topbar (3.5) —
small, self-contained, and it builds the `useCurrentUser()` context Phase 9 will also want — then
bridge to the API with the JWT (4) and have `membership-applications` verify it (5) — authentication
only, since that's the other half of the original question and doesn't need the role→permission
model settled yet — then user management (6) — which is what makes provisioning practical and
de-risks sign-up (7) — then the UI-library swap (8), then role-based nav/route gating for both
`staff-app` and `membership-applications` together (9), pushed out once because the role→permission
model needed more thought than a quick pass between other phases, and finally JWT caching (10),
pushed to last because it's a pure optimization with no other phase depending on it and nothing to
measure until real usage exists.
