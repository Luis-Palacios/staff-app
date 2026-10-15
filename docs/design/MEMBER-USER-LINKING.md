# Member ↔ user linking: account card, dialogs, lists and user detail

Implementation spec for **linking members to user accounts** (Members and Users in the sidebar,
`/members`, `/members/[id]`, `/members/new`, `/users`, `/users/[id]`). Read the cross-repo spec
first: `../docs/specs/member-user-linking.md` (workspace folder `members-management/docs/specs/`).
It holds the rules and the contracts; this file is the staff-app work.

- **Member detail** gets an *Account* card (below Small groups) and a status pill next to the name:
  *No account*, *Invited*, *Linked*. From the card an admin or elder can **link an existing user**,
  **invite the member as a user**, **cancel the invite**, or **unlink**.
- **Add member** gets an *Invite as a user* checkbox (needs an email).
- **Members list** gets an *Account* column and a Linked / Invited / No account filter.
- **Users list** gets a *Member* column and a Linked / Not linked filter.
- **User detail** is a **new page** (`/users/[id]`): the account's sign-in details and a *Linked
  member* card with link and unlink. It is read-only apart from that; editing a user is out of scope.

**Decided:** everything in the cross-repo spec's *Rules*. In short: 1:1 link stored on the member;
email match is only a suggestion; unlink removes only the relationship; invites from a member use
the fixed role Small Group Leader; "Invited" is a pending invite for the member's email; only
`STAFF_ADMIN_ROLES` (admin, elder) see the controls. No gendered pronouns in copy.

**Depends on the API:** `membership-management/docs/MEMBER-USER-LINK-API-HANDOFF.md` (stages 1 to 3
at least: `userId` on members, `PUT`/`DELETE /members/{id}/user`; stage 5 for `GET /me`). If a stage starts before the API
is ready, note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`member-user-linking`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and Spanish,
before the next one starts. After each stage, write a short summary of what changed and anything
that differs from the canvas in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Member ↔ User linking", plus the main boards, which already include the account features
  (defaults on):
  - Member detail: `MemberDetail` (account **linked**, default), `MemberDetail-AccountNone`,
    `MemberDetail-AccountInvited`; `MemberDetail-Dark` where it exists.
  - Dialogs (on Member detail): `MemberDetail-LinkUser`, `MemberDetail-LinkUser-NoMatch`,
    `MemberDetail-LinkUser-Dark`, `MemberDetail-InviteUser`, `MemberDetail-Unlink`.
  - Add member: `MemberForm` (invite option unchecked), `MemberForm-Invite` (checked, prefilled).
  - Members list: `Members` (Account column and filter on by default).
  - Users: `Users` (Member column and filter).
  - User detail: `UserDetail` (linked), `UserDetail-NotLinked`, `UserDetail-LinkMember`,
    `UserDetail-Unlink`.
  The `account`, `overlay` and `toast` props on the boards (see the board source in the canvas)
  name the states; use them as the state list.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API client, types, role helper, server actions | ✅ | (this commit) |
| 2. Member detail: Account card and pill | ✅ | (this commit) |
| 3. Dialogs: link, invite, cancel invite, unlink | ✅ | (this commit) |
| 4. Add member: invite as a user | ✅ | (this commit) |
| 5. Members list: Account column and filter | ✅ | (this commit) |
| 6. Users list: Member column and filter | ✅ | (this commit) |
| 7. User detail page | ✅ | (this commit) |
| 8. Design review fixes | 🟨 in progress | |

### Decisions and deviations

- Stage 1: `getUser` reads `admin/get-user`, which returns the bare user object (not `{ user }`).
  Invite create and cancel from a member run in server actions, so `createInvite` / `cancelInvite`
  in `api/auth-api/client.ts` forward the cookie, `accept-language` (the invite email is localized
  from it) and an `Origin` taken from the incoming request, because better-auth rejects a
  cookie-bearing POST without one. **Not tried against a real session yet** (no signed-in
  browser in this stage): confirm in stage 3 when the dialogs exist; if auth-server refuses the
  server-side call, fall back to `authClient.invite.*` from the dialog like `NewInviteForm`.
  The two 409s from membership-management are told apart by the English `detail` (matched, never
  shown) in `getApiErrorMessage`. Actions live in `members/_actions/account-actions.ts` and return
  `{ ok, error }`; the Users pages reuse them (no `users/_actions` folder needed). Helpers
  (`getAccountStatus`, `getPendingInvite`, `getSuggestedUsers`, `getSuggestedMembers`) are in
  `lib/members/account.ts`; a pending invite past `expiresAt` doesn't count as Invited. `lint`
  and `tsc` pass.
- Stage 2: `loadMemberAccount` (`members/_lib`) reads the session role, then `getUser` for a linked
  member (a 404/400 becomes the D2 "Account not found" state) or `listInvites` for an unlinked one.
  **Deviation:** only admin/elder can read the invite list, so for other roles the pill can't
  tell Invited from No account and shows Linked or No account only. The card is hidden for them,
  as specced. The card has no action buttons yet (invite, link, cancel invite, unlink); stage 3
  adds them with their dialogs, since a button with no handler can't be committed. The
  "sign-in details line" is "Account created {date}" (no last-sign-in data from `get-user`).
  The page grid is now `lg:grid-cols-[2fr_3fr]` with groups and account stacked in the right
  column; the two cards lost their `flex-[n_1_340px]` sizing for it. `DetailCardHeading` gained an
  optional `id`. `lint` and `tsc` pass. **Not checked visually yet** (needs a signed-in browser:
  light/dark, 1440/1024/390, en/es).
- Stage 2 check, done in the signed-in browser: Spanish, light and dark at desktop width are fine.
  390 wasn't checked: the browser tool couldn't shrink the window. The Next dev overlay shows a
  `spellCheck` hydration warning that comes from a browser extension, not from this code.
- Stage 3: `MemberAccountActions` (client) owns the buttons, which dialog is open and the toast
  (`SavedToast`, re-keyed per message). Link and Invite are HeroUI `Modal`s like `AddMemberDialog`;
  Unlink and Cancel invite reuse `ConfirmDialog` (danger). The unlinked-user list is loaded by a
  server action each time the Link dialog opens (users minus any a member points to; suggested =
  same email). **Deviation:** the Link list is radio rows with a search box, not a combobox, so the
  suggested match and the helper text can sit in the dialog. Invite checks `listUsers` for the typed
  email first; if an account exists the action returns `userExists` and the dialog says to link
  instead (with a button) rather than hiding the invite up front. Only the user's name goes to the
  client, not the whole auth user. Tried in the browser (dark, es, member #1 without an email):
  Invite is disabled with its hint, the Link dialog opens, lists the one unlinked user and keeps
  **Link user** disabled until a pick; Cancel closes it. Then, on the test DB with member #1
  (email set to a test address, `MEMBERSHIP_API_URL`/token unset on auth-server): **invite sent**
  (the server-side cookie + `Origin` call to `invite/create` works, no fallback to `authClient`
  needed; pill and card go to Invited, toast shown), **cancel invite** (back to No account),
  **link** to the unlinked user (pill and card go to Linked with name, role, verified) and
  **unlink** (back to No account), all with the toast. **Still untried:** the automatic link on
  invite acceptance, which needs the shared token and URLs set on both services, and the 409
  messages and the "user already exists" invite path. `lint` and `tsc` pass.
- Stage 4: `MemberForm` takes `canInvite` (from `canManageLinks` on the `/members/new` page; never
  on edit). The HeroUI `Checkbox` is disabled with a hint ("Enter a valid email above…") until the
  email field is a valid email, and un-checks itself if the email becomes invalid; the submit label
  follows (`willInvite`). `createMemberAction(values, invite)` creates the member, then calls
  `inviteMemberAction` (so the role check, the existing-account check and the cookie/`Origin`
  forwarding are the same as the Account card) and redirects with `?saved=createdInvited`, or
  `?saved=inviteFailed` (danger toast, `MemberForm.inviteFailed`). The member is never rolled back.
  An invite refused because the email already has an account lands in `inviteFailed` too; the
  Account card then offers the suggested match. New keys: `MemberForm.inviteLabel`, `inviteHelp`,
  `inviteNeedsEmail` (not in the copy table), `submitAndInvite`, `inviteFailed`, and
  `SavedToast.createdInvited`. `lint` and `tsc` pass. Tried in the browser (dark, es, desktop): the checkbox
  is disabled with its hint until the email is valid, ticking it changes the submit label, and
  submitting created member #66 and sent the invite (pill and Account card show Invited). Fix found
  there: HeroUI's `Checkbox.Content` must wrap the control and the label, with `Description` as its
  sibling; nesting them the other way broke the click and the layout. **Not checked:** light mode,
  1024/390, the toasts (they time out during the browser wait), and the `inviteFailed` path.
  Test member #66 and its pending invite are left on the dev DB.
- Stage 5: `MembersList` (server) reads the session role; for admin/elder it makes one
  `listInvites()` call and builds `accounts` (member id → status via `getAccountStatus`), passed to
  `MembersBrowser`. Other roles get no `accounts`, so no column, no filter and the original table.
  The filter reuses `StatusTabs` (as Applications does) and keeps its state in `?account=`
  (`replaceState`, no refetch); counts follow the search. `AccountStatusCell` (Linked and Invited
  pills, muted "No account" text) is shared by the table and the cards, where it sits at the right of
  the name row. **Deviations:** keys went in the existing `MembersBrowser` namespace (not
  `Members.*`), and `AccountStatus` joined `CLIENT_NAMESPACES`. The table's min width grows from 760
  to 880 with the column. `lint` and `tsc` pass. Tried in the browser (dark, es, 1440): column,
  counts (0 / 1 / 55) and the Invited filter. **Not checked:** light, 1024/390 cards, Linked
  filter with data (no linked member on the dev DB), a non-admin role.
- Stage 6: `UsersList` now also calls `listMembers()` once and builds `userId → { id, name }`;
  the new client `UsersBrowser` owns the All / Linked / Not linked `StatusTabs` (state in
  `?member=`, `replaceState`) and renders the table and the cards. `UserMemberLink` (member name
  linking to `/members/[id]`, or muted "Not linked") is used by both; the card shows it as a
  "Member:" line. **Deviations:** the row "Open" action is **not** added: `/users/[id]` doesn't
  exist until stage 7, which must add it (table and card). Keys went in `UsersTable` (and
  `UserCard.member`), not `Users.*`; `UserCard` joined `CLIENT_NAMESPACES` because the card is now
  rendered from a client component. Added `UsersTable.noMatches` so a filter with no rows doesn't
  say "No users yet". Table min width 760 → 880. `lint` and `tsc` pass. Tried in the browser (dark,
  es, 1440): column, counts and the Linked filter's empty state. **Not checked:** light, 1024/390
  cards, and a linked row (the dev DB has one user and no link).
- Stage 7: `/users/[id]` (`loadUser` in `users/_lib`, cached) reads `admin/get-user` (404/400 →
  shared not-found) and finds the linked member from `listMembers()`, then `getMember` for the
  group count. Like `/users`, the page redirects anyone but admin/elder to `/`, so there is no
  read-only variant to render: every viewer can link and unlink (the "adminsOnly" copy from the
  table isn't needed and wasn't added). Cards: `UserAccountCard` (name, email, role, email
  verified, status, joined; read-only) and `UserMemberCard` (+ client `UserMemberActions`, and
  `LinkMemberDialog`, the member-side radio list mirrored: suggested match = same email and no
  user, search, "Link member"). The link and unlink actions are the existing
  `linkMemberUserAction` / `unlinkMemberUserAction`; the new `listLinkableMembersAction` loads the
  members without a user each time the dialog opens. **Deviations:** namespaces are `UserDetail`
  (server), `UserMember` (server) and `UserMemberActions` (client, added to `CLIENT_NAMESPACES`);
  the unlink body uses the member id only (no name), as in the table. The "Open" action from stage
  6 is added: `DataTableOpenLink` in a new last column (table min width 880) and a "View account"
  link on the card. `lint` and `tsc` pass. Tried in the browser (dark, es, 1440): Users list with
  the Open column, User detail for an unlinked user, the Link dialog (lists members with no user,
  search), **link** (card shows name, member number and group count, toast) and **unlink**
  (confirmation text, back to the not-linked card, toast), and the 404 for an unknown id. Fix found
  there: the "Email verified" row label read "Correo" twice in Spanish, so it is now
  "Verification" / "Verificación". Then checked: light mode at 390 (User detail, Users cards, Link
  dialog all fit, nothing scrolls sideways), light at 1024 (User detail), and English (User detail
  and Link dialog). **Not checked:** the suggested match (no member shares a user's email on the
  dev DB), a linked user whose member has several groups, the Users table at 1024.
- Pending checks for stages 4 to 6 (done afterwards): the 390 width can't be reached by shrinking
  the window, so pages were loaded in a same-origin iframe of 390 / 1024 px. Light mode, the
  Members list, Users list and Add member at 390, the Members list at 1024, the Linked filter and
  a linked row (member #67 linked through the dialog, then unlinked) all look right. **Fixes found:**
  (1) the four-segment Account filter was wider than 390 and "No account" was cut off: `StatusTabs`
  now has `max-w-full overflow-x-auto`, so it scrolls inside its own width (also used by
  Applications and Groups); (2) `SavedToast` dropped `?saved=` with `router.replace`, which
  refetched the page without the param and unmounted the toast after about 0.4 s (this also
  affected the existing "Member added" toast); it now uses `history.replaceState`, as the
  applications filter does, and the toast stays its 4 s. The failure path was exercised: a new
  member with the email of an existing user and "Invite as a user" ticked is created without an
  account, and the `inviteFailed` toast renders. **Account column at 1024:** it now sits right after Member, so it is visible without scrolling; the table still scrolls sideways at that width (natural width about 905) and it is Phone and Open that sit past the fold. **Non-admin role checked** (signed in as a Small Group Leader, dark, es, 1440): the Members list is
  the original table (no Account column, no filter), Member detail has the pill but no Account card,
  Add member has no "Invite as a user" checkbox, and `/users` redirects to the dashboard.
  **Member detail at 390** (admin, dark, es, iframe): the Account card sits below Small groups
  in all three states (No account, Invited, Linked), buttons wrap, and the Invite, Link and Unlink
  dialogs fit with nothing clipped or scrolling sideways. Linking then unlinking #67 worked.
  **Not covered:** light mode for these dialogs at 390 (Link was checked in light at 1440). Test members #66 and #67
  and #66's pending invite are left on the dev DB.

- Stage 8 (design review, first pass, admin, light, English, 2026-10-15). **Fix:** `SavedToast` had
  three color literals (`#13325A`, `#FDA29B`, `#8EDDB4`, from before this branch); they are now
  `bg-navy-800`, `text-danger-on-dark`, `text-success-on-dark` (same values, checked in the browser
  through computed styles). The literals grep, `pnpm lint` and `tsc` are clean. **Checked, no
  change needed:** Link dialog at 390 in light (list, search, buttons fit; page width 390); Invite and
  Unlink dialogs at 390 in light (nothing clipped); the suggested match on member #67 (same email
  as the user Luis Palacios: "Suggested match" with a "Same email" pill, then "Other users" with
  search) at desktop in light; Escape closes the Link dialog and focus goes back to the opener with
  its focus ring; the "Linked to Luis Palacios" toast in light at desktop; Users table at 1024 (the
  page doesn't scroll sideways; the table scrolls inside its card and Joined and Open sit past the
  fold, as on the Members list). Link then Unlink of #67 left it as "No account". **Noticed, not
  changed:** the toast sits at the bottom centre and covers the Unlink button of the Account card for
  its 4 s when the viewport is short. **Not covered yet:** comparing each screen with the canvas
  boards (light and dark), gold-on-light text, the end-to-end accept-invite flow.

## Token changes

None expected: the pills and dialogs use existing semantic tokens (success, warning/attention,
danger, muted). If a status needs one that doesn't exist, add it in its own first stage per
`docs/design/README.md` and list it here.

| Token | File | Light | Dark | Why |
| --- | --- | --- | --- | --- |
| (none) | | | | |

New Tailwind utilities needed (`@theme inline` in `globals.css`): none.

## The API

Everything is called server-side from server actions and server components, like the existing
members actions. The browser never calls an API.

**membership-management** (via `api/members-api/client.ts`, `authenticatedFetch`):

| Function | Call | Notes |
| --- | --- | --- |
| `listMembers()` / `getMember(id)` | existing | `MemberSummary` / `MemberDetail` gain `userId: string \| null` |
| `linkMemberUser(id, userId)` | `PUT /members/{id}/user` | 409 "member already linked" / "user already linked" |
| `unlinkMemberUser(id)` | `DELETE /members/{id}/user` | 204, idempotent |
| `getMe()` | `GET /me` | wrap in React `cache()`; the signed-in user's member and the groups they lead. No screen here uses it yet; `docs/specs/small-group-leader-access.md` does |

**auth-server** (via `api/auth-api/client.ts`, session cookie, existing pattern):

| Function | Call | Notes |
| --- | --- | --- |
| `listUsers(cookie)` | existing `admin/list-users` | for the link dialog and the Users list |
| `getUser(cookie, id)` | `admin/get-user` (new client function, existing endpoint) | for `/users/[id]` |
| `listInvites(cookie)` | existing `/api/custom-auth/invites` | pending invites by email = "Invited" |
| create / cancel invite | existing better-invite via `authClient.invite.*` or the existing invite server code | role fixed to `smallGroupLeader` |

HTTP status → message (use `getApiErrorMessage()`; add keys, never show backend English):
403 → "Only admins and elders can do this." 404 member → existing not-found. 409 member already
linked → "This member is already linked to another user." 409 user already linked → "This user is
already linked to another member." Auth-server errors: `useAuthErrorMessage()`.

**Helpers (stage 1):**

- `canManageLinks(role)`: `STAFF_ADMIN_ROLES.includes(role)`, in `lib/auth/roles.ts`. Hide controls
  for others (don't show a disabled button); the API enforces it anyway.
- `getAccountStatus(member, pendingInvites)`: `"linked" | "invited" | "none"`.
- `getSuggestedUsers(member, users, linkedUserIds)`: users whose email equals the member's email
  (case-insensitive) and aren't linked. `linkedUserIds` = `userId`s from `listMembers()`.
- `getSuggestedMembers(user, members)`: the mirror for the User side (members with no `userId`
  whose email equals the user's).
- Server actions in `app/(app)/members/_actions/` and `app/(app)/users/_actions/`: link, unlink,
  invite-from-member (creates the invite, returns the toast kind), cancel-invite. Each revalidates
  `/members`, `/members/[id]`, `/users`, `/users/[id]`, and returns a failure object like
  `MemberActionFailure`.

## Stage 2: Member detail (`/members/[id]`)

**Files:** `app/(app)/members/[id]/page.tsx`, `app/(app)/members/[id]/_components/`.

- **Header pill** next to the name: `StatusBadge` (dot + word, never HeroUI `Chip`). *Linked* uses
  the success tone, *Invited* the attention tone, *No account* the muted tone. It is a link that
  scrolls to the Account card (`#acct-title`) with an accessible label from the copy table.
- **Layout:** two columns at `lg`. Small groups stay **first** in the right column; the **Account
  card sits below it**. Below `lg` the order is details, small groups, account.
- **Account card**, one of three states (only render for roles that can see it; other roles don't
  get the card):
  - *No account*: copy explaining they can't sign in yet; two actions, **Invite as user…**
    (primary) and **Link existing user…**. If the member has no email, Invite is disabled with the
    hint from the copy table.
  - *Invited*: shows the invited email, who/when if available, and **Cancel invite**; plus a
    secondary **Link existing user…**.
  - *Linked*: avatar/initials, user name, email, role (`RoleBadge`), verified status, the sign-in
    details line, a link **Go to sign-in access** → `/users/[userId]`, and **Unlink**. If the user
    can't be found (D2): show "Account not found" with only **Unlink**.
- No dialog opens on page load. Focus returns to the control that opened a dialog when it closes.

### States

Loading is the existing page skeleton. Error uses `app/(app)/error.tsx`. Non-admin roles: no card,
and the pill still shows (it is information, not an action).

## Stage 3: Dialogs

**Files:** `app/(app)/members/[id]/_components/` (`link-user-dialog.tsx`, `invite-user-dialog.tsx`,
`unlink-dialog.tsx`), using HeroUI v3 `Modal` compound components.

- **Link existing user.** Shows *Suggested match* first (same-email user, with a "Same email"
  tag) and a search box over **other** unlinked users (search by name or email; "No users match
  “…”" empty state). Selecting enables **Link user**. Only users who aren't linked to a member are
  listed (say so in the helper text). On success: close, toast "Linked to …", card moves to
  *Linked*. 409s show inline in the dialog.
- **Invite as user.** Email field prefilled from the member (editable; "From the member’s profile.
  Change it if they use another address."), read-only role *Small Group Leader* with the helper
  text, **Send invite**. If a user with that email already exists the dialog doesn't offer to
  invite: it points to Link instead (the suggested match). On success: toast "Invite sent to …",
  card moves to *Invited*. Note: when they accept, the account links to the member automatically.
- **Unlink.** Confirmation naming the member and the user; says plainly that the user keeps their
  account and role and the member keeps their profile and groups, and that a Small Group Leader or
  Deacon stops seeing this member's groups (cross-repo spec, rule 4); **Unlink** is the destructive
  button, **Cancel** the default focus. On success toast "Unlinked from …".
- Toasts use the existing toast pattern; announce them politely for screen readers.
- Dark mode: all three dialogs have to hold up in dark (`MemberDetail-LinkUser-Dark`).

## Stage 4: Add member (`/members/new`)

**Files:** `app/(app)/members/new/`, the member form component, `_actions/member-actions.ts`.

- Under the contact fields, a checkbox row **Invite as a user**, with the helper "Invites start with
  the Small Group Leader role. Change it later from Users." Only for roles that `canManageLinks`.
- Disabled (with hint) until the email field is a valid email; enabling/disabling follows the field
  live. Not shown on the edit form.
- When checked, the submit label changes to **Add member and send invite**. The action creates the
  member, then sends the invite. If the member is created but the invite fails, redirect to the
  member detail with an error toast ("Member added. The invite couldn't be sent. Try again from
  the Account card."), never roll the member back.

## Stage 5: Members list (`/members`)

**Files:** `app/(app)/members/page.tsx`, `_components/`.

- Add an **Account** column to the table (`dataTable()`): *Linked* and *Invited* pills,
  and plain muted "No account" text for none. On cards below `md`, put the same status in the card.
  Compute statuses from `userId` plus one `listInvites()` call; don't call per row.
- Add the segmented filter chips **All / Linked / Invited / No account** next to the existing
  filters, combinable with search. Counts follow the list; keep the empty states.
- Hidden for roles that can't see links (they get the original table).

## Stage 6: Users list (`/users`)

**Files:** `app/(app)/users/page.tsx`, `_components/users-summary-table.tsx`,
`user-card-summary.tsx`, `user-status-chips.tsx`.

- Add a **Member** column: member name linking to `/members/[id]`, or muted "Not linked". Cards
  below `md` show it too.
- Add filter chips **All / Linked / Not linked** beside the existing status chips.
- Each row's "Open" action goes to the new `/users/[id]` (Stage 7). Source of the member names is
  one `listMembers()` call, matched on `userId`.

## Stage 7: User detail (`/users/[id]`)

**Files:** `app/(app)/users/[id]/page.tsx`, `loading.tsx`, `_components/`.

- `StaffAppPageHeader` with breadcrumbs Users › name, eyebrow "User". Two cards:
  - **Account details**: name, email, role (`RoleBadge`), verified, status, joined date. Read-only.
  - **Linked member**: *linked* → member name, number, groups count, link to `/members/[id]`,
    **Unlink**. *Not linked* → the line "This account isn’t connected to a member. That’s normal for
    staff who aren’t members of this church." and **Link a member**.
- **Link a member** dialog mirrors the member-side one: *Suggested match* (member with the same
  email and no `userId`), search over other members without a user, **Link member**.
  **Unlink** confirmation says the account keeps its role, and that a Small Group Leader or Deacon
  stops seeing the member's groups.
- Controls only for `canManageLinks`; others see the cards without actions.
- 404 for an unknown user id uses the shared not-found.

## Copy

All new UI text, both languages (see "Adding UI text" in `CLAUDE.md`; *tú*, *grupo pequeño*).
Namespaces `MemberAccount` (member side) and `UserMember` (user side); add them to
`CLIENT_NAMESPACES` only if a client component needs them (prefer passing labels from the server
parent). The table is the complete starting set; take the exact wording from the boards when they
differ and keep the two files in step.

| Namespace.key | English | Español |
| --- | --- | --- |
| `MemberAccount.title` | Account | Cuenta |
| `MemberAccount.statusLinked` | Linked | Vinculada |
| `MemberAccount.statusInvited` | Invited | Invitada |
| `MemberAccount.statusNone` | No account | Sin cuenta |
| `MemberAccount.pillLinked` | Linked to a user. Go to sign-in access | Vinculada a un usuario. Ir al acceso de inicio de sesión |
| `MemberAccount.pillInvited` | Invited. Go to sign-in access | Invitada. Ir al acceso de inicio de sesión |
| `MemberAccount.pillNone` | No account. Go to sign-in access | Sin cuenta. Ir al acceso de inicio de sesión |
| `MemberAccount.noneBody` | {name} can’t sign in yet. Invite them, or connect a user that already exists. | {name} aún no puede iniciar sesión. Invítale o conecta un usuario que ya exista. |
| `MemberAccount.invite` | Invite as user… | Invitar como usuario… |
| `MemberAccount.link` | Link existing user… | Vincular usuario existente… |
| `MemberAccount.cancelInvite` | Cancel invite | Cancelar invitación |
| `MemberAccount.signInAccess` | Go to sign-in access | Ir al acceso de inicio de sesión |
| `MemberAccount.unlink` | Unlink | Desvincular |
| `MemberAccount.accountNotFound` | Account not found | Cuenta no encontrada |
| `MemberAccount.adminsOnly` | Only admins and elders can link or invite users. | Solo administradores y ancianos pueden vincular o invitar usuarios. |
| `MemberAccount.noEmailHint` | Add an email to this member to invite them. | Agrega un correo a este miembro para invitarle. |
| `MemberAccount.linkTitle` | Link a user account | Vincular una cuenta de usuario |
| `MemberAccount.suggestedMatch` | Suggested match | Coincidencia sugerida |
| `MemberAccount.sameEmail` | Same email | Mismo correo |
| `MemberAccount.searchOthers` | Or search other users | O busca otros usuarios |
| `MemberAccount.onlyUnlinked` | Only users who aren’t linked to a member are listed. | Solo se muestran los usuarios que no están vinculados a un miembro. |
| `MemberAccount.noUsersMatch` | No users match “{query}” | Ningún usuario coincide con “{query}” |
| `MemberAccount.linkAction` | Link user | Vincular usuario |
| `MemberAccount.inviteTitle` | Invite as a user | Invitar como usuario |
| `MemberAccount.inviteBody` | Send {name} an invitation to sign in. | Envía a {name} una invitación para iniciar sesión. |
| `MemberAccount.invitedEmail` | Invited email | Correo de la invitación |
| `MemberAccount.emailHelp` | From the member’s profile. Change it if they use another address. | Del perfil del miembro. Cámbialo si usa otra dirección. |
| `MemberAccount.role` | Role | Rol |
| `MemberAccount.roleSmallGroupLeader` | Small Group Leader | Líder de grupo pequeño |
| `MemberAccount.roleHelp` | Invites sent from a member start with this role. Change it later from Users. | Las invitaciones enviadas desde un miembro empiezan con este rol. Cámbialo después desde Usuarios. |
| `MemberAccount.autoLinkNote` | When they accept, the new account links to this member automatically. | Cuando acepte, la nueva cuenta se vincula a este miembro automáticamente. |
| `MemberAccount.sendInvite` | Send invite | Enviar invitación |
| `MemberAccount.unlinkTitle` | Unlink {name} from this user? | ¿Desvincular a {name} de este usuario? |
| `MemberAccount.unlinkBody` | {email} keeps their account and role. Only the connection to this member is removed. If their role is Small Group Leader or Deacon, they’ll stop seeing this member’s small groups. You can link them again later. | {email} conserva su cuenta y su rol. Solo se elimina la conexión con este miembro. Si su rol es Líder de grupo pequeño o Diácono, dejará de ver los grupos pequeños de este miembro. Puedes vincularle de nuevo más adelante. |
| `MemberAccount.toastLinked` | Linked to {email} | Vinculada a {email} |
| `MemberAccount.toastInvited` | Invite sent to {email} | Invitación enviada a {email} |
| `MemberAccount.toastUnlinked` | Unlinked from {email} | Desvinculada de {email} |
| `MemberAccount.errorMemberLinked` | This member is already linked to another user. | Este miembro ya está vinculado a otro usuario. |
| `MemberAccount.errorUserLinked` | This user is already linked to another member. | Este usuario ya está vinculado a otro miembro. |
| `MemberAccount.errorForbidden` | Only admins and elders can do this. | Solo administradores y ancianos pueden hacer esto. |
| `MemberForm.inviteLabel` | Invite as a user | Invitar como usuario |
| `MemberForm.inviteHelp` | Invites start with the Small Group Leader role. Change it later from Users. | Las invitaciones empiezan con el rol Líder de grupo pequeño. Cámbialo después desde Usuarios. |
| `MemberForm.submitAndInvite` | Add member and send invite | Agregar miembro y enviar invitación |
| `MemberForm.inviteFailed` | Member added. The invite couldn’t be sent. Try again from the Account card. | Miembro agregado. No se pudo enviar la invitación. Inténtalo de nuevo desde la tarjeta Cuenta. |
| `Members.columnAccount` | Account | Cuenta |
| `Members.filterAll` / `filterLinked` / `filterInvited` / `filterNone` | All / Linked / Invited / No account | Todos / Vinculados / Invitados / Sin cuenta |
| `Users.columnMember` | Member | Miembro |
| `Users.notLinked` | Not linked | Sin vincular |
| `Users.filterLinked` / `filterNotLinked` | Linked / Not linked | Vinculados / Sin vincular |
| `UserMember.title` | Linked member | Miembro vinculado |
| `UserMember.accountDetails` | Account details | Datos de la cuenta |
| `UserMember.signInDetails` | Sign-in details | Datos de inicio de sesión |
| `UserMember.notLinkedBody` | This account isn’t connected to a member. That’s normal for staff who aren’t members of this church. | Esta cuenta no está conectada a un miembro. Es normal para el personal que no es miembro de esta iglesia. |
| `UserMember.link` | Link a member | Vincular un miembro |
| `UserMember.linkAction` | Link member | Vincular miembro |
| `UserMember.searchOthers` | Or search other members | O busca otros miembros |
| `UserMember.onlyWithoutUser` | Only members who don’t have a user are listed. | Solo se muestran los miembros que no tienen un usuario. |
| `UserMember.unlinkTitle` | Unlink this user from {name}? | ¿Desvincular a este usuario de {name}? |
| `UserMember.unlinkBody` | This account keeps its role. Member #{id} keeps their profile and small groups. Only the connection is removed. If the role is Small Group Leader or Deacon, the account stops seeing that member’s small groups. You can link them again later. | Esta cuenta conserva su rol. El miembro n.º {id} conserva su perfil y sus grupos pequeños. Solo se elimina la conexión. Si el rol es Líder de grupo pequeño o Diácono, la cuenta deja de ver los grupos pequeños de ese miembro. Puedes vincularles de nuevo más adelante. |
| `UserMember.adminsOnly` | Only admins and elders can link or unlink members. | Solo administradores y ancianos pueden vincular o desvincular miembros. |

Spanish uses *tú* and avoids gendered forms where it can; where it can't ("Vinculada" for the
member's account), check the board and keep the whole app consistent. Reconcile any key that
already exists in `messages/en.json` instead of duplicating it.

## Not in this spec

- Editing a user (profile, role, ban, password) on User detail; designed later.
- The per-church "every user must be a member" setting.
- Changing the invite role from the member screens (fixed to Small Group Leader).
- Retrying a failed accept-invite notification (see the auth-server handoff).

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states (none, invited, linked,
      account not found; each dialog; toasts).
- [x] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; list pages switch table → cards
      below `md`; Account card sits below Small groups at every width.
- [x] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word, never color alone.
- [x] Focus ring visible on every control; focus returns to the opener when a dialog closes;
      Escape closes; toasts are announced.
- [x] Roles other than admin/elder: no Account card, no link controls on any screen, pill still
      visible; the API 403 is handled if reached.
- [x] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean);
      `messages/parity.ts` passes.
- [x] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
