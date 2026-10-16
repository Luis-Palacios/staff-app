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
| 0. This handoff | ⬜ | |
| 1. Permissions in the session | ⬜ | |
| 2. Nav | ⬜ | |
| 3. Pages and actions | ⬜ | |
| 4. Leader member access | ⬜ | |
| 5. Docs | ⬜ | |

### Decisions and deviations

- **API types are hand-written** (`api/*/types.ts`, no generator), so "regenerate" means updating
  them by hand against the API handoff. Done in the stage that first needs each type.

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
| `PATCH /members/{id}` | `members: update` + scope; **a body with `email` is 403 without `members: all`, even unchanged** | member edit |
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

New strings, if any, are added to `messages/en.json` and `messages/es.json` in the stage that needs
them, and listed here.

| Namespace.key | English | Español |
| --- | --- | --- |

## Not in this spec

See the cross-repo spec's *Not in this spec*.

## Design review checklist

Run after implementation. Record findings in the progress log.

- [ ] Each role's nav matches rule 7; every hidden page is a 404 by URL.
- [ ] 1440 / 1024 / 390, light and dark, English and Spanish: nothing clipped, no sideways scroll.
- [ ] No color, font, radius or shadow literals in the changed files, no new `dark:` overrides.
- [ ] Focus ring visible on every control; focus after dialogs makes sense.
- [ ] No hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
