# Roles and permissions: the nav, pages and actions check permissions

Implementation spec for the staff-app side of **roles and permissions** (the whole app, no new
route). Read the cross-repo spec first: `../docs/specs/roles-and-permissions.md` (workspace folder
`members-management/docs/specs/`). It holds the rules (numbered below as *rule N*); this file is
what changes here.

- Every role-name check (`STAFF_ADMIN_ROLES`, `getSmallGroupAccess`, `canManageLinks`,
  `reportAccess`) becomes a check on the **permissions** auth-server puts in the session.
- The nav, each page (`notFound()`) and each server action use the same check, so a hidden item is
  also unreachable by URL or by posting.
- Leaders (`smallGroupLeader`, `deacon`) get member detail and edit for the members in their groups,
  with no email field and no account card. The add-member picker stops reading the full members list.

**Decided:** everything in the spec's *Rules*. Nothing to reopen. No design canvas change: the
screens are the existing ones, shown or hidden by permission. The one new visible state is a leader
opening a member from the group detail.

**Depends on the API:** auth-server `ROLES-PERMISSIONS-HANDOFF.md` (session `permissions`, JWT
`perms`) and membership-management `ROLES-PERMISSIONS-API-HANDOFF.md` (its *Permissions* table in
`docs/ARCHITECTURE.md` lists what each route needs). Both are done and on `main`; both must be
running locally. If either isn't, say so; stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`roles-permissions`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. Each stage is
tried by signing in as every role (`admin`, `elder`, `smallGroupLeader`, `deacon`, `user`) and
checking the nav and the pages by URL; the *Keep working* list from the spec is run at the end.

- **Design (source of truth for look):** none new. Reuse the existing pages and
  `EmptyState` / `StaffAppPageHeader`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 0. This handoff | ✅ | 4885d89 |
| 1. Permissions in the session | ✅ | 4d160d4 |
| 2. Nav | ✅ | 2fccc9e |
| 3. Pages and actions | ✅ | 461a990 |
| 4. Leader member access | ✅ | b28a575 |
| 5. Docs | ✅ | f281bb7 |
| 6. Review fix: no-role redirect loop | ✅ | (this commit) |

### Decisions and deviations

- **API types are hand-written** (`api/*/types.ts`, no generator), so "regenerate" meant updating
  them by hand against the API handoff: `MemberOption` and `listMemberOptions()` (stage 4),
  `AuthSession.permissions` (stage 1). The other routes' shapes didn't change.
- **How each role was tried.** Real sessions for `admin`, `smallGroupLeader` (linked to member 20,
  leads group 3), a second unlinked leader, and scratch users `elder`, `deacon` (linked to member 41,
  co-leads group 2) and `user` (linked to member 9), made by inserting `session` rows in
  auth-server's dev DB and signing the cookie with its secret. The scratch users and the two links
  were removed afterwards. Every page by URL was loaded for every role (`curl` with the cookie, reading
  Next's `NEXT_HTTP_ERROR_FALLBACK;404` / `NEXT_REDIRECT` markers, since streaming answers 200 for
  both), plus the sidebar's links per role. In a browser (a second origin, `127.0.0.1`, so the
  existing admin session wasn't touched; narrow widths in same-origin iframes because the window
  can't be resized below the screen): `user` dashboard and My profile (1440 light EN, 390 and 1024
  dark ES); leader group detail, member detail and member edit (390 and 1024 light EN), the
  add-member picker (dark EN); elder staff dashboard and member detail (dark EN, two columns).
- **Not covered by the full light/dark × 1440/1024/390 × EN/ES matrix.** Only the combinations above
  were looked at. The changed screens reuse existing components and no token or layout changed.
- **Not exercised:** server actions that write (create/close/set leader, report create/edit/delete,
  link/unlink, invite from a member, assign role), to keep the dev data as it was. Their permission
  checks were verified against each role's real `permissions` (admin and elder pass every action's
  check; leader and deacon pass exactly `smallGroups: update, manageMembers`, the picker, the report
  actions and `members: update`; `user` none). The one write tried: a leader's member edit (phone,
  address), which went through with no `email` in the body, and was then reverted.
- Stage 2: the Dashboard leaf needs "no `smallGroups: all`", which an all-of check can't say, so
  `NavItem` has `unless` next to `requires`. Links inside a group have their own `requires`, and a
  group with no visible link is dropped.
- Stage 3: `/users/[id]` needs `user: get` and `members: view, all, link` (it lists members for the
  link card); the account server actions list their own needs (`members: link`, plus `user: list`,
  `invites: create` / `cancel`, `members: view, all` where they read lists). A role with
  `smallGroups: all` but no `membershipApplications: view` etc. gets the staff dashboard without
  those sections. The dashboard for a plain `user` is a new small greeting (`WelcomeDashboard`).
- Stage 4: the group detail links a member's name when the caller has `members: view` and either
  `members: all` or the group is open (a closed group's members are out of scope, rule 3). The member
  page links back to Members only with `members: view` + `all`, to a group only when the viewer can
  open it (full access, or they lead it), and shows the Account card only with `members: link`.
  Without `members: all` the email field shows only while the member has no `userId` (rule 8); a linked
  member gets a note instead, and the form sends `email` only when it changed. The API stays the guard.
- The add-member dialog no longer shows an email under each name or searches by it; the placeholder
  says "name" only (copy table below).
- `members: update` is not required for `GET /members/{id}` (rule 11), so My profile never checks a
  permission. A linked `user` was tried: Member #9 shows with its contact data.
- Stage 6 (review fix): stage 3 made `requireStaffSession` send a `null` role to `/needs-role`,
  but that page sent every non-`pending` role (`null` included) back to `/`, a redirect loop. It now
  treats no role as `pending` too. Checked with `tsc` and ESLint only; not reproduced live (it needs
  a user whose role was cleared in auth-server's DB).
- Left for the workspace stage: `members-management/CLAUDE.md` still says the roles are mirrored by
  hand in `staff-app/lib/auth/roles.ts`. That file now only lists names, for display and assigning.

## Token changes

None.

## The API

What the session and the routes give us. Roles are never checked here; only the permissions below.

**Session** (`GET /api/auth/get-session`): `{ user, session, permissions }`. `permissions` is
`Record<resource, action[]>`, as declared in auth-server's `statements.ts`. A session without it
means no permissions (rule 10).

| Role | Permissions |
| --- | --- |
| `admin`, `elder` | every app resource, all actions; `user: create, list, get, ban, set-role` (admin also the rest of better-auth's `adminAc`) |
| `smallGroupLeader`, `deacon` | `members: view, search, update` · `smallGroups: view, update, manageMembers` · `smallGroupReports: view, create, update, delete` |
| `user`, `pending` | none |

**Routes this app calls whose gate changed** (full table: membership-management
`docs/ARCHITECTURE.md`, *Permissions*):

| Route | Needs | Used by |
| --- | --- | --- |
| `GET /members` | `members: view` + `all` | Members list, link dialogs, account status |
| `GET /members/options` → `[{ id, name }]` | `members: search` | Add-member picker (new) |
| `GET /members/{id}` | own member: nothing (rule 11); others: `members: view` + members scope | member detail, My profile |
| `PATCH /members/{id}` | `members: update` + scope; **a body with `email` for a linked member is 403 without `members: all`, even unchanged** | member edit |
| `POST /members` | `members: create` | add member |
| `PUT`, `DELETE /members/{id}/user` | `members: link` | account card, link dialogs |

Out of scope is 404, a missing permission is 403.

## Stage 1: Permissions in the session

**Files:** `api/auth-api/types.ts`, `api/auth-api/client.ts`, `lib/auth/permissions.ts` (new),
`lib/auth/get-permissions.ts` (new), `lib/auth/roles.ts`, `lib/auth/small-group-access.ts`,
`lib/contexts/user-context.tsx`, `app/(app)/layout.tsx`.

- `AuthSession.permissions: Permissions`, `getSession` fills `{}` when auth-server sends none.
- `lib/auth/permissions.ts` (shared, no `server-only`): `Resource` and per-resource `Action` unions,
  `Permissions`, `can(permissions, { resource: [actions] })` (all-of, the same shape better-auth
  uses). Fail closed: a missing resource is no permission.
- Server `getPermissions()`; client `usePermissions()` from `UserProvider`.
- `getSmallGroupAccess`, `reportAccess`, `canManageLinks` re-implemented on permissions (`full` =
  `smallGroups: all`, `scoped` = `view` without `all`) so callers keep working; `lib/auth/roles.ts`
  keeps only names and labels.

## Stage 2: Nav

**Files:** `config/site.ts`, `components/sidebar.tsx`.

`NavItem.access` → `NavItem.requires` (a `can` check). Matrix per rule 7; `Dashboard` as a leaf
shows to everyone **without** `smallGroups: all`, so the leaf and the group are two items with
opposite checks. A group with no visible children is hidden.

## Stage 3: Pages and actions

`notFound()` on every page per rule 7 (Members, Applications, Users, Invites, group pages, staff
dashboard), staff dashboard sections by permission, a permission check at the top of every server
action. Remove the "TEMPORARY" comments. `requireStaffSession` treats a `null` role as `pending`.

## Stage 4: Leader member access

Add-member picker on `GET /members/options` (no email). Member names in the group detail link to the
profile when the caller has `members: view`. Member detail and edit for leaders: no account card
(needs `members: link`), no email field, and the PATCH body omits `email` entirely. My profile needs
no permission (rule 11).

## Stage 5: Docs

This log, roadmap Phase 9 marked done pointing at the spec, `CLAUDE.md` note, the *Keep working* run.

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `WelcomeDashboard.description` | You're signed in. | Ya iniciaste sesión. |
| `WelcomeDashboard.title` | Your profile | Tu perfil |
| `WelcomeDashboard.body` | Your profile shows your contact details and the groups you belong to. | Tu perfil muestra tus datos de contacto y los grupos a los que perteneces. |
| `WelcomeDashboard.openProfile` | Open My profile | Abrir Mi perfil |
| `GroupMembers.memberPlaceholder` (changed) | Search by name | Busca por nombre |
| `GroupMembers.noEmail` (removed) | | |

## Not in this spec

See the cross-repo spec's *Not in this spec*.

## Design review checklist

Run after implementation. Record findings in the progress log.

- [x] Each role's nav matches rule 7; every hidden page is a 404 by URL.
- [ ] 1440 / 1024 / 390, light and dark, English and Spanish: nothing clipped, no sideways scroll. (Partly: see the decisions above.)
- [x] No color, font, radius or shadow literals in the changed files, no new `dark:` overrides.
- [ ] Focus ring visible on every control; focus after dialogs makes sense.
- [x] No hard-coded strings (`react/jsx-no-literals` is clean).
- [x] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
