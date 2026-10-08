# Staff App Copilot Instructions

## Commands

Use pnpm; the repository has `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `.npmrc`.

```bash
pnpm install
pnpm dev                 # Next.js development server at http://localhost:3001
pnpm build               # production build
pnpm start               # production server at http://localhost:3001
pnpm lint                # ESLint with --fix; applies Prettier fixes too
npx tsc --noEmit         # type-check
pnpm exec eslint --fix app/(app)/users/page.tsx  # lint/fix one TS/TSX file
```

There is no configured test runner or single-test command. Confirm the framework choice before adding tests.

## Architecture

- This Next.js 16 App Router application is a backend-for-frontend for staff management. The `(auth)` route group contains public authentication flows; `(app)` contains the authenticated product. `(app)/layout.tsx` gets the server session, redirects unauthenticated or unverified users, blocks the `pending` role, and supplies `UserProvider` for client components.
- `proxy.ts` is the authentication boundary: it rewrites browser requests under `/api/auth/*` to `AUTH_SERVER_URL` so cookies remain same-origin, then applies page-navigation redirects based on the session cookie. When adding an auth route, update its public or always-allowed path rules as needed.
- Browsers must not call `auth-server` or `membership-applications` directly. Server-side auth clients forward the incoming cookie to `auth-server`; membership API clients use `authenticatedFetch`, which mints a short-lived JWT and attaches it as a bearer token. Reuse `apiFetch` and `ApiError` rather than adding ad-hoc fetch wrappers.
- Environment values are parsed through the `server-only` `lib/env/server.ts`. Do not expose backend URLs with `NEXT_PUBLIC_`; `AUTH_SERVER_URL` must be a bare HTTP(S) origin. Required values are documented in `.env.example`.
- `api/` owns typed service clients and DTOs. Pages are primarily server components; async data-list children are rendered in `Suspense` with their matching skeleton. Current list pages use a desktop table and mobile cards.
- The authenticated shell is composed in `(app)/layout.tsx`: `AppShell` owns responsive sidebar/topbar state, while `Topbar` reads `useCurrentUser()`. Auth routes must not render that shell.

## UI and routing conventions

- `config/site.ts` is the source of truth for application metadata and sidebar navigation. Add or rename navigation there, not inline in the sidebar. For string icons, update `NavIconName`, add the SVG in `components/icons.tsx`, and register it in `components/sidebar.tsx`; compatible Heroicon components can be passed directly.
- Use `StaffAppPageHeader` and breadcrumb definitions from `config/breadcrumbs.ts` for application pages. Reuse `title()` and `subtitle()` from `components/primitives.ts` where those heading primitives fit.
- HeroUI is v3 rather than the v2/NextUI API. Use its compound components, such as `Disclosure.Trigger`, `Disclosure.Content`, `TextField` with `InputGroup`, and `Avatar.Fallback`.
- Tailwind v4 is configured in `styles/globals.css`, not in a Tailwind config file. It imports HeroUI styles and defines the class-based dark variant. `--container-lg` is intentionally set to `80rem`, so avoid `max-w-lg` where Tailwind's normal 32rem width is intended; use an unaffected width such as `max-w-md` or `max-w-xl`.
- Add `"use client"` only when browser APIs, React client hooks, event handlers, or client-only libraries require it. Keep backend calls and cookie forwarding in server components.

## Authorization and roadmap

- `lib/auth/roles.ts` is staff-app's role source of truth. `STAFF_ADMIN_ROLES` currently gates the Users and Invites pages because their upstream endpoints allow only admins and elders.
- Role-based navigation and generalized route gating are intentionally deferred to Phase 9 of `docs/AUTH-INTEGRATION-ROADMAP.md`; do not create a parallel permission helper or copy the current temporary checks before that phase is designed. JWT request caching is likewise deferred to Phase 10.
- The roadmap describes contracts with the sibling `auth-server` and `membership-applications` repositories. Treat role, JWT-claim, and service-endpoint changes as cross-repository contract changes and update the roadmap accordingly.

## Linting conventions

- ESLint enforces grouped import ordering, sorted JSX props with callbacks last, and blank lines before `return` and after declaration blocks. `pnpm lint` modifies files because it runs `eslint --fix`.
- Use the `@/*` repository-root import alias. Unused arguments may be prefixed with `_`; `no-console` is a warning.
