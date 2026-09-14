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
    **session's role** (Phase 3), independent of the JWT entirely.
  - `membership-applications` has no session — the JWT is its only signal. The `jwt` plugin's
    payload is customized to include just the `role` claim (small, stable token — the standard
    "claims-based authorization" pattern, e.g. how Auth0/Okta/Cognito hand off `roles`/`groups`)
    rather than a precomputed permission set, so the token doesn't have to change shape every time
    `statements.ts` does (Phase 4). `membership-applications` then computes role→permission itself
    from a small Python port of the same mapping (Phase 5) — a deliberate, reviewed duplication,
    not synced automatically, acceptable at the current scale (4 roles, 4 custom resources).
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
route-group split between public/authenticated pages exists yet. Left as-is on purpose; Phase 3
introduces middleware-based route protection, and restructuring the layout (e.g. an `(auth)` vs
`(app)` route group) belongs with that work rather than being done twice.

---

## Phase 3 — Reverse-proxy `/api/auth/*` + route protection
`[ ]`

**Repo(s):** `staff-app`

**What:** Add a `rewrites()` entry in `next.config.mjs` forwarding `/api/auth/:path*` to
`auth-server`'s `/api/auth/:path*`, and simplify `lib/auth-client.ts` by dropping the `baseURL`
option entirely — see Phase 2's notes on why better-auth's own relative-path default
(`"/api/auth"`) then does the right thing automatically, no env var needed by the browser at all.
Verify the cookie now shows up as same-origin (check
dev tools: `Domain` should be unset/host-only, not `auth-server`'s host). Add Next.js middleware
that reads the session and redirects unauthenticated users away from protected routes. Also
restructure routing so `/sign-in` (and any other public page) isn't wrapped in `<AppShell>` —
e.g. an `(auth)` route group with its own plain layout alongside an `(app)` group that keeps the
current `AppShell`-wrapped `app/layout.tsx` behavior (deferred here from Phase 2 on purpose, see
its notes above). Then, now that `session.user.role` is reliably available server-side: filter
`config/site.ts`'s `navItems`
(and gate the matching routes) by role — decide the role→visible-nav-items mapping together when
we plan this phase, and decide where that mapping lives (e.g. alongside `siteConfig` vs a
dedicated `lib/permissions.ts`).

**Why:** This is the "same domain" trick you were reading about, minus the deployment
constraint of putting everything under one apex domain. Confirms the whole cookie story works
before building anything on top of it. The nav-gating piece answers your original question about
`site.ts` directly — it only needs the session, not the JWT.

**New concepts:** Next.js `rewrites()` as a reverse proxy, how `Set-Cookie` passes through a
proxy hop, Next.js middleware for auth gating, reading a session in Server Components vs Client
Components, deriving UI visibility from `role` without a network call.

**New env vars:** `staff-app/.env.example`: `AUTH_SERVER_INTERNAL_URL` (server-only — where
Next.js's own server reaches `auth-server`; same as `AUTH_SERVER_URL` in local dev, diverges once
these are separate Docker containers on an internal network). `AUTH_SERVER_URL` from Phase 2 can
likely be removed once the browser no longer calls `auth-server` directly.

---

## Phase 4 — JWT bridge from staff-app to membership-applications
`[ ]`

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

**New env vars:** none new in `staff-app` (reuses `AUTH_SERVER_INTERNAL_URL`).

---

## Phase 5 — membership-applications verifies the JWT
`[ ]`

**Repo(s):** `membership-applications`

**What:** Add a JWT-verification dependency (new dependency needed — e.g. `python-jose` or
`PyJWT`, plus a JWKS client with caching so it's not fetching the JWKS on every request) that
validates the `Authorization: Bearer` header against `auth-server`'s JWKS and extracts the `role`
claim set in Phase 4. Write a small Python port of the relevant parts of `statements.ts` (a
role→permission mapping, e.g. a dict/enum — deliberately hand-maintained, reviewed together
whenever `statements.ts` changes, not auto-synced) and use it to gate the `applications` and
`people` routers per-route, not just "is there a valid role."

**Why:** Right now `membership-applications` trusts every request unconditionally — this closes
that. Since the JWT carries only `role` (Phase 4's decision), `membership-applications` is the
one that has to turn that into an actual authorization decision — this is where that logic lives.

**New concepts:** FastAPI dependencies for auth (`Depends(...)`), verifying a JWT against a JWKS
endpoint (vs a shared secret), caching a JWKS fetch so verification doesn't hit the network per
request, deliberately duplicating a small piece of authorization logic across two languages as a
maintained contract rather than a shared library.

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
Phase 3 proxy. Gated by the same middleware/role check built in Phase 3.

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

## Later / stretch (not yet scheduled)

- **Full permission-granularity enforcement in FastAPI** — Phase 5 starts with role checks;
  decide later whether to mirror `statements.ts`'s per-resource CRUD statements exactly.
- **Dockerizing all three** — each repo containerized, plus whatever local dev story (e.g.
  docker-compose) makes running all three together easy. Explicitly out of scope for this doc
  beyond noting that the reverse-proxy approach (Phase 3) and internal-URL env vars (Phase 3/4)
  were chosen to not paint this into a corner.
- **JWKS caching/rotation behavior** — worth a closer look once Phase 5 is live and there's
  actual traffic to observe.

---

## Suggested order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Reasoning: fix the cheap-but-important permission gap first (1),
then build the session round-trip in the smallest possible slice (2) before adding the proxy on
top of it (3), then bridge to the API (4–5) since that's the other half of your original
question, then user management (6) — which is what makes provisioning practical and de-risks
sign-up (7) — and finish with the UI-library swap (8) once the mechanics aren't in question
anymore.
