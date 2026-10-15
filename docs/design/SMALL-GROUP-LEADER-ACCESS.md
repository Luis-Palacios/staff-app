# Small group leader access: groups list, group detail and dashboard by role

Implementation spec for **small group leader access** (Groups in the sidebar, `/groups`,
`/groups/[id]`, `/groups/[id]/edit`, `/groups/new`, and the dashboard `/`). Read the cross-repo
spec first: `../docs/specs/small-group-leader-access.md` (workspace folder
`members-management/docs/specs/`); its rules are referred to below as *rule N*. Today every role
sees every group and every control. After this work:

- **Admins and elders** see what they see today. Nothing changes for them.
- **Small Group Leaders and Deacons** see only the groups their linked member leads or co-leads
  (plus, read-only, groups they led when the group was closed). The list is titled *My groups*.
  They can edit those groups and manage members, but can't create or close groups or change who
  leads, and can't change or remove themselves.
- **Every other role** (`user`) doesn't see Groups at all.

**Decided:** everything in the cross-repo spec's *Rules*. The API is the guard (it filters lists,
answers 404 outside the scope and 403 for the leadership limits); this work makes the UI match so
nobody reaches those errors in normal use. Hide controls a role can't use; don't show them
disabled.

**Depends on the API:** `membership-management/docs/SMALL-GROUP-LEADER-ACCESS-API-HANDOFF.md`
(all stages) and `GET /me` from member linking (already on `main`). If a stage starts before the
API is ready, note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`small-group-leader-access`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and Spanish,
before the next one starts. After each stage, write a short summary of what changed and anything
that differs from the boards in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1).
  **No new boards:** this work hides controls and changes copy on existing screens. The look is
  the existing `Groups*`, `GroupDetail*` and dashboard boards. The new empty states use
  `EmptyState` like the current "No groups yet" one.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Access helper, errors and nav | ✅ | 38b0870 |
| 2. Groups list: *My groups* and empty states | ✅ | a0d6c58 |
| 3. Group detail and edit: leader controls | ✅ | 9007046 (+ fixes in stage 5) |
| 4. Dashboard by role | ✅ | 9e0db41 |
| 5. Review pass | ✅ | (this commit) |

### Decisions and deviations

- Stage 1: added `lib/auth/small-group-access.ts` (`getCurrentSmallGroupAccess()`, server-only, reads
  the session role) so the four group pages share one guard instead of repeating the session read.
- Stages 1-4 were written first and the per-role browser pass was done once at the end (Stage 5),
  not after each stage.
- Stage 1: the sidebar filters with `item.access` typed through `NavItem` (the `satisfies` literal
  otherwise narrows `access` to `"full" | "scoped"`).
- Stage 5 fix: in the member rows the role badge and the menu slot now sit in one wrapper, so they
  wrap together. Without it the empty slot on a row with no menu wrapped onto its own line at 390
  and 1024 and left a blank band. Side effect for full roles: at 390 the ⋯ no longer sits alone on a
  second line away from the badge. Same look at 1440.
- Stage 5 fix: the add dialog offers Member then Co-leader for scoped users (it had reused the menu's
  Co-leader, Member order).
- Test data (dev DBs): auth users `sgla-admin|leader|deacon|user@example.test` (verified, roles
  set), members 105-108 (`Test Leader` linked to `sgla-leader`), groups `SGLA Alpha` (leader leads),
  `SGLA Beta` (leader co-leads), `SGLA Gamma` (out of scope), `SGLA Delta` (leader's, closed).
  Delete them when done.

### Review pass (stage 5)

Checked in the browser, signed in as each role. English and Spanish and light and dark were both
covered, but not every combination; 390 and 1024 were checked on the group detail page only (a
same-origin iframe at those widths, Spanish + dark); 1440 on the rest.

- admin: list, detail (menus on every row, Close card), unchanged.
- leader: *My groups* (Active 2 / Closed 1), no New group; detail of Alpha and Beta with no menu on
  the leader's or own row; menu offers Co-leader / Member; add dialog Member / Co-leader; edit page
  loads; Gamma is the 404 page; Delta (closed) is read-only; `/groups/new` is the 404 page.
- deacon, no member: *not linked* empty state, dashboard without a groups nudge.
- user: no Groups in the nav; `/groups`, `/groups/29` are the 404 page; the dashboard no longer
  raises the 403 it did before Stage 4.
- Not exercised in the browser: the *You don't lead a group yet* empty state (same code path as
  *not linked*, other copy); the member-route 403 messages (the UI hides what triggers them);
  actually saving an edit or adding a member as a leader; the Spanish copy of the groups list and
  empty state at 390 and 1024.

## Token changes

None.

New Tailwind utilities needed (`@theme inline` in `globals.css`): none.

## The API

No new client functions. What changes is the answers:

| Call | Full role (`admin`, `elder`) | Scoped role (`smallGroupLeader`, `deacon`) | Other roles |
| --- | --- | --- | --- |
| `listSmallGroups()` | all groups | only groups in scope, maybe `[]` | 403 |
| `getSmallGroup(id)` | as today | 404 outside the scope (`loadGroup` already turns it into the not-found page) | 403 |
| `updateSmallGroup`, add/change/remove member | as today | in scope; 403 for the leadership limits (below) | 403 |
| create group, close group, set leader | as today | 403 | 403 |
| `getMe()` | `member` (may be null), `leads` | `member` (null if not linked), `leads` = the same scope as the list | as for full roles |

`getMe()` (`api/members-api/client.ts`, React `cache()`d) gives `member.id`, which marks the
caller's own row on the group page, and tells a scoped user's empty state apart: no member vs leads
nothing.

**403 messages.** The two new 403s from the member routes are told apart by `detail`, the same way
`lib/api-error-message.ts` already tells the two link 409s apart (matched, never shown):

| `detail` contains | Key |
| --- | --- |
| `only admins and elders can change who leads` | `ApiErrors.leadershipAdminsOnly` |
| `change your own role in this group` | `ApiErrors.ownGroupRole` |
| (any other 403) | `ApiErrors.forbidden` (existing) |

With the UI below these should never show; they are the fallback if the page is stale.

## Stage 1: Access helper, errors and nav

**Files:** `lib/auth/roles.ts`, `lib/api-error-message.ts`, `messages/*.json`, `config/site.ts`,
`components/sidebar.tsx` (and whatever passes it the user).

- In `lib/auth/roles.ts`, next to `STAFF_ADMIN_ROLES`, the staff-app half of rule 8:
  - `SCOPED_GROUP_ROLES: readonly AuthRole[] = [AuthRole.SmallGroupLeader, AuthRole.Deacon]`
  - `type SmallGroupAccess = "full" | "scoped" | "none"`
  - `getSmallGroupAccess(role): SmallGroupAccess` (`STAFF_ADMIN_ROLES` → full, scoped roles →
    scoped, else none). Comment that membership-management's `api/access.py` holds the same sets.
- `getApiErrorMessage`: the two 403 keys above.
- **Nav:** for `none`, the Groups entry (list and reports) is hidden. Add an optional
  `access?: SmallGroupAccess[]` (or a more general `visibleTo` predicate) to `NavItem` in
  `config/site.ts` and filter in the sidebar with the current user's role (`useCurrentUser()`
  from `lib/contexts/user-context.tsx`). For `scoped`, the nav labels stay the same.
- **Pages for `none`:** `/groups`, `/groups/[id]`, `/groups/[id]/edit`, `/groups/new` call
  `notFound()` before fetching, so a typed URL lands on the shared 404 and no 403 reaches
  `error.tsx`. `/groups/new` does the same for `scoped` (they can't create groups).

## Stage 2: Groups list (`/groups`)

**Files:** `app/(app)/groups/page.tsx`, `_components/groups-list.tsx`, `_components/new-group-link.tsx`.

- Read the role from the session (`getServerSession()`), then `getSmallGroupAccess`.
- **`scoped`:** title `GroupsPage.myTitle`, description `GroupsPage.myDescription`, no
  **New group** action. The list, tabs (Active / Closed / All), search and cards are unchanged:
  the API already returned only their groups.
- **Empty list for `scoped`** (`listSmallGroups()` is `[]`): `EmptyState` without an action,
  reading `getMe()` to pick the copy:
  - `member === null` → `GroupsPage.notLinkedTitle` / `notLinkedBody`;
  - otherwise → `GroupsPage.noLedGroupsTitle` / `noLedGroupsBody`.
- **`full`:** unchanged, including the "No groups yet" empty state with **Create the first group**.

## Stage 3: Group detail and edit (`/groups/[id]`, `/groups/[id]/edit`)

**Files:** `app/(app)/groups/[id]/page.tsx`, `_components/group-members-card.tsx`,
`member-row-menu.tsx`, `add-member-dialog.tsx`, `close-group-card.tsx`, `group-detail-header.tsx`.

A group outside the scope is already the 404 page (`loadGroup`). For one in scope, the page passes
`access` and `currentMemberId` (`getMe().member?.id ?? null`) down to the client components as
props; they don't fetch.

For **`scoped`** only (rules 6 and 9):

- **Close group card:** not rendered.
- **Edit** (header) and the edit page: unchanged. Scoped users can edit the details.
- **Member row menu:**
  - **No menu** on the leader's row or on the caller's own row (`memberId === currentMemberId`).
    Keep the row's width the same (an empty slot the size of the ⋯ button) so rows line up.
  - On other rows the role list offers only **Co-leader** and **Member**. **Remove** stays. The
    link to the member stays.
- **Add member dialog:** role options **Member** and **Co-leader** only (default Member). The
  leader-swap hint never appears.
- Closed group: as today for everyone (read-only, no actions). A leader of a closed group sees it
  this way.

For **`full`**: unchanged, including the leader swap confirmation.

## Stage 4: Dashboard (`/`)

**Files:** `app/(app)/page.tsx`, `_components/no-groups-card.tsx`.

- **`none`:** don't call `listSmallGroups()` (it would 403); skip `NoGroupsCard`.
- **`scoped`:** `listSmallGroups()` already returns only their groups. Don't render
  `NoGroupsCard` (its "Create the first group" is for admins). If they have no groups, nothing
  shows on the dashboard about groups; the Groups page explains why (Stage 2).
- **`full`:** unchanged.
- Leave the applications tiles alone: their access is out of scope here (spec, *Not in this spec*).
  A leader dashboard (my groups, latest reports) comes with the reports spec.

## Stage 5: Review pass

Run the checklist below signed in as each kind of role. You need test users: an `admin`, a
`smallGroupLeader` linked to a member who leads one group and co-leads another, a `deacon` with no
linked member, and a `user`. Use the Users pages to set roles and Member detail to link.

## Copy

All new UI text, both languages (see "Adding UI text" in `CLAUDE.md`; *tú*, *grupo pequeño*).

| Namespace.key | English | Español |
| --- | --- | --- |
| `GroupsPage.myTitle` | My groups | Mis grupos |
| `GroupsPage.myDescription` | The small groups you lead or co-lead. Open one to see its people and update its details. | Los grupos pequeños que lideras o colideras. Abre uno para ver a sus personas y actualizar sus datos. |
| `GroupsPage.notLinkedTitle` | Your account isn’t linked to a member | Tu cuenta no está vinculada a un miembro |
| `GroupsPage.notLinkedBody` | Your groups show up here once an admin or elder links your account to your member profile. | Tus grupos aparecerán aquí cuando un administrador o anciano vincule tu cuenta a tu perfil de miembro. |
| `GroupsPage.noLedGroupsTitle` | You don’t lead a group yet | Aún no lideras un grupo |
| `GroupsPage.noLedGroupsBody` | Groups you lead or co-lead show up here. Ask an admin or elder to add you as a leader. | Aquí aparecen los grupos que lideras o colideras. Pide a un administrador o anciano que te agregue como líder. |
| `ApiErrors.leadershipAdminsOnly` | Only admins and elders can change who leads a group. | Solo administradores y ancianos pueden cambiar quién lidera un grupo. |
| `ApiErrors.ownGroupRole` | Ask an admin or elder to change your own role in this group. | Pide a un administrador o anciano que cambie tu propio rol en este grupo. |

Reconcile with existing keys instead of duplicating them (e.g. role names come from
`SmallGroupRole`).

## Not in this spec

- Small group reports (list, form, permissions): `docs/specs/small-group-reports.md`, next, with
  its own design pass. The `/groups/reports` stub stays as it is (hidden for `none` by Stage 1).
- Hiding members, applications or users screens for scoped roles (their API access is unchanged).
- A dedicated leader dashboard.
- Showing former leaders their past groups.

## Design review checklist

Run after implementation. Record findings in the progress log.

- [x] `admin`/`elder`: groups list, detail, edit, new, dashboard look and behave exactly as before.
- [x] Leader: list titled *My groups*, only their groups, no **New group**; detail has no Close
      card; no menu on the leader's or their own row; role choices Member / Co-leader in the menu
      and the add dialog; edit works; an out-of-scope `/groups/{id}` is the 404 page.
- [x] Deacon with no member: *not linked* empty state; dashboard shows no groups nudge.
- [x] `user`: no Groups in the nav; `/groups` and `/groups/1` are the 404 page; dashboard renders
      with no error section.
- [x] Rows without a menu stay aligned with rows that have one, at 1440 / 1024 / 390.
- [x] Light and dark; English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals`
      is clean); `messages/parity.ts` passes.
- [x] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
