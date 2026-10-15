# My profile: the signed-in user's account and member record

Implementation spec for **My profile** (account menu › My profile, `/users/me`), which is a stub
today (`app/(app)/users/me/page.tsx` renders only a header):

- **Linked:** the signed-in user's member record (contact & personal, small groups and roles)
  plus their sign-in details, in the Member detail layout.
- **Not linked:** sign-in details plus a "Member profile · Not linked" card explaining what
  linking adds; admins and elders get a link to their own User detail to link themselves.

**Decided:**

- Always the signed-in user. Read-only: no edit, link, unlink or invite actions on this page.
  Edit profile, photo upload and a saved language preference come later (see "Not in this spec").
- Every role that can sign in can open it (admin, elder, smallGroupLeader, deacon, user). It must
  **not** use `loadUser()` (`users/_lib/load-user.ts`): that redirects anyone who isn't an admin or
  elder, and auth-server's `admin/get-user` refuses them. Read from the session and `GET /me`.
- No breadcrumb. The stub's `usersBreadcrumb` goes: most roles can't open Users, so the crumb
  would lead nowhere. The page header is the person (avatar, eyebrow, name, meta), like Member
  detail.
- No "Status" row. A banned user can't be signed in, so it would always say Active.
- Group rows link to `/groups/{id}` only when the viewer can open that group (see Stage 2).

**Depends on the API:** nothing new.

- `GET /me` (membership-management, any signed-in role) → `{ userId, role, member: { id, name } | null, leads }`.
  Already wrapped as `getMe()` in `api/members-api/client.ts` (`cache()`d).
- `GET /members/{id}` has no role guard (any authenticated caller), so `getMember(String(me.member.id))`
  works for every role. Use it only with the id from `/me`, never an id from the URL.
- The session (`getServerSession()`) gives `id`, `name`, `email`, `role`, `emailVerified`.
  better-auth's get-session also returns `user.createdAt`, but `AuthSessionUser`
  (`api/auth-api/types.ts`) doesn't declare it yet: Stage 1 adds it.

Work through it **stage by stage**, one reviewable commit per stage, on the **`feature/my-profile`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each
stage, write a short summary of what changed and anything that differs from the canvas in the
progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "My profile".
- **Boards:** `MyProfile` (linked, Andrea Gutiérrez, Small Group Leader), `MyProfile-NotLinked`
  (not linked, María González, Admin), `MyProfile-Dark` (linked, dark). Tweaks on `MyProfile`:
  `mode`, `link` (linked/none), `groups` (some/none).
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced 2026-10-15.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Loader and session type | ✅ | see `git log` |
| 2. Linked page | ✅ (linked layout not yet seen in browser) | see git log |
| 3. Not-linked page, copy, sidebar | ✅ | see git log |
| 4. Design review fixes | 🟨 partial, see log | see git log |

### Decisions and deviations

- **Stage 1, `createdAt`:** confirmed live: auth-server's `GET /api/auth/get-session` returns
  `user.createdAt` (ISO string), so `createdAt: string` was added to `AuthSessionUser` and the
  "Account created" row stays.
- **Stage 1, `loadMyProfile`:** `leadIds` is typed `ReadonlySet<number>`; a 404 from `getMember`
  means not linked (`member: null`).
- **Stage 2, shared cards:** approved. `MemberContactCard` and `MemberGroupsCard` got an optional
  `variant: "default" | "self"`; `MemberGroupsCard` also got `canOpen(group)` (default: always true).
  Member detail is unchanged.
- **Stage 2, deviations from the canvas:** contact card eyebrow stays "Profile" (board says "Member");
  group names keep the text-link pattern, no whole-row link or chevron; the contact footer has no
  tinted background (border-top only); the header avatar has no gap ring.
- **Stage 2, not-linked accounts:** the page renders the header and sign-in card only; the Member
  profile card and single-column layout come in Stage 3.
- **Stage 3, not-linked page:** `MyAccountCard` got an optional `stacked` prop (single column, rows
  divided, no footer); new `MyMemberCard` holds the heading, `Not linked` badge, copy and the link button
  (admin/elder) or the ask-an-admin callout (others). `{church}` comes from `getChurchContext()`.
- **Stage 3, sidebar:** `isActivePath` in `components/sidebar.tsx` returns false for `/users/me`, so
  Access › Users no longer lights up there.
- **Stage 3, metadata and loading:** `generateMetadata` gives the tab title "My profile"; `users/me/loading.tsx`
  is a header skeleton plus two card skeletons.
- **Stage 4, review so far** (signed in as a linked small group leader and as an unlinked admin):
  no color literals or new `dark:` overrides in the changed files; linked page renders in light, dark and
  Spanish with no sideways scroll at 1024 and 390 (columns stack below `lg`); both of the leader's groups
  link to `/groups/{id}` (the leader leads both). Fixed: the email in the sign-in card broke mid-word at
  1024 (`break-all` → `break-words`).
- **Stage 4, roles checked:** deacon and plain `user` (both not linked) load `/users/me` with no redirect
  and see the "Ask an admin or elder" callout, no button; the sidebar hides Access › Users for `user`.
- **Stage 4, still open:** canvas comparison for the three boards; the elder role; a group where the viewer
  is only a member (should be plain text); a link to a deleted member; focus ring and keyboard order;
  the four canvas deviations above.

## Token changes

None. Everything uses existing tokens and components (`card()`, `StatusBadge`, `InitialsAvatar`,
`DetailCardHeading`, `textLink()`).

## Stage 1: loader and session type

**Files:** `api/auth-api/types.ts`, new `app/(app)/users/me/_lib/load-my-profile.ts`.

- Add `createdAt: string` to `AuthSessionUser`. First confirm it's really in the get-session
  response (log it once locally); if it isn't, drop the "Account created" row instead and note it
  in the log.
- `loadMyProfile = cache(async () => …)`, `server-only`:
  - `const session = await getServerSession()`; if null, `redirect("/sign-in")` (the layout already
    guards, this is only for types).
  - `const me = await getMe()`.
  - `member = me.member ? await getMember(String(me.member.id)) : null`. If `getMember` answers
    404 (link points at a deleted member), treat it as not linked rather than erroring.
  - Return `{ user: session.user, member, access: getSmallGroupAccess(session.user.role),
    leadIds: new Set(me.leads.map(l => l.smallGroupId)) }` (`MeLead.smallGroupId`).

## Stage 2: linked page (`/users/me`)

**Files:** `app/(app)/users/me/page.tsx`, `users/me/_components/my-profile-header.tsx`,
`users/me/_components/my-account-card.tsx`; small prop additions to the member cards.

Layout is the Member detail grid: `grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`,
left column the contact card, right column a `flex flex-col gap-5` with groups then account.

### Header (`MyProfileHeader`)

Model it on `members/[id]/_components/member-detail-header.tsx`, without breadcrumbs or actions:

- `InitialsAvatar size="xl"` (64px; the board draws 72px with a 4px page-colored gap ring, so use
  `xl` plus `ring-4 ring-background outline outline-1 outline-border` or similar; keep the ring
  optional if it fights the tokens). Same navy/gold swap as the top bar avatar
  (`bg-accent text-accent-foreground` in light shows navy; check dark shows gold on navy).
  This circle is where the photo goes later.
- Eyebrow "My profile" (the `DetailCardHeading` eyebrow style: 12px semibold uppercase
  `text-eyebrow`), then the name as the page `<h1>` with the `title()` primitive.
- Meta line, `text-sm text-muted`, wraps: email · role `StatusBadge` (neutral, solid-dot, label
  from the existing role labels used by `RoleBadge` in `users/_components/role-badge.tsx`) ·
  linked only: "Member **#148**" and "**2** small groups" (reuse `UserMember.memberNumber` /
  `UserMember.groupCount` or the header's own keys).

### Contact & personal (left)

Reuse `MemberContactCard` with a new prop `readOnly` (or `editHref?: string`, omitted here) that:

- hides the "Edit" link in the card heading;
- shows a footer row: info icon + "These come from your church's member record. If something is
  wrong, ask an admin or elder to update it." (`text-[13.5px] text-muted`, `border-t
  border-separator`, `bg-surface-secondary` or the card's footer tone, as on the board).

Eyebrow on the board is "Member" (Member detail says "Profile"); pass it as a prop or keep
"Profile" and log the deviation, whichever is less churn.

### My groups & roles (right, top)

Reuse `MemberGroupsCard` with:

- `title` / empty-state copy overrides ("My groups & roles", "Your groups and roles show up here
  when you join one.") via props or a `variant="self"`;
- a `canOpen(group) => boolean`. When false, render the group name as plain text (no link, no
  chevron). Rule: `access === "full"`, or `access === "scoped" && leadIds.has(group.smallGroupId)`.
  `user` role (`access === "none"`) never links. The board draws the whole row as a link with a
  trailing chevron; keeping the existing card's name-as-`textLink` pattern is fine, log it.

Rows show "Joined {date}" and the role badge exactly as on Member detail.

### Sign-in details (right, bottom) (`MyAccountCard`)

`card()` with `DetailCardHeading` eyebrow "Account", title "Sign-in details". A `dl` laid out as
`grid sm:grid-cols-2` (board: auto-fit 220px columns, rows separated by `border-separator`):

| Label | Value |
| --- | --- |
| Email | email + `StatusBadge` success solid-dot "Verified" (or warning ring-dot "Not verified") |
| Role | role `StatusBadge` |
| Account created | `formatLocalDate(createdAt, locale)` (same as User detail "Joined") |

Footer line, `text-[13.5px] text-muted`: "Your role and access are managed by your church's
admins."

`UserAccountCard` takes an `AdminUserListItem`; don't force the session user into that type. A
small new card (sharing the `Field` pattern) is cleaner.

## Stage 3: not-linked page, copy, sidebar

### Layout

Same grid, but left = `MyAccountCard` (single-column `dl`, rows separated top-border, no footer
line), right = the Member profile card.

### Member profile card

- Heading: eyebrow "Member", title "Member profile", and on the right a neutral ring-dot
  `StatusBadge` "Not linked" (same as `AccountStatus.none` styling).
- Two paragraphs (`text-[14.5px] leading-relaxed text-body`): "Your account isn't connected to a
  member of {church}. That's normal for staff who aren't members of this church." and "If you are a
  member, linking your account shows your contact details and small groups here, and lets you
  submit small group reports." `{church}` is the church name from `getChurchContext()`.
- `canManageLinks(role)` (admin, elder): primary button-link "Link from my user record" with
  `LinkIcon`, to `/users/{session.user.id}`, plus muted helper "Opens your account in Users, where
  you can pick your member."
- Everyone else: the accent-soft info callout (as in `UserMemberCard`'s suggested-match note):
  "Ask an admin or elder to link your account to your member record."

### Sidebar and metadata

- No sidebar item is active on this page (check `components/sidebar.tsx` doesn't highlight
  "Access › Users" from the `/users/*` prefix; if it does, exclude `/users/me`).
- Page `<title>` / metadata: "My profile".

### States

- Loading: add `users/me/loading.tsx`, copying `users/[id]/loading.tsx` / `members/[id]/loading.tsx`
  (header skeleton + two card skeletons).
- `GET /me` or `getMember` failure (other than the 404 above): let it reach `app/(app)/error.tsx`.
- Linked with no groups: the groups card's empty state (Tweak `groups=none`).

## Copy

All new UI text, both languages (see "Adding UI text" in `CLAUDE.md`). Reuse existing keys where
the text already exists (`UserDetail.email`, `.role`, `.verifiedYes`, `.verifiedNo`, `.joined`,
`UserMember.memberNumber`, `.groupCount`, `MemberGroupsCard.joined`, `SmallGroupRole.*`).

| Namespace.key | English | Español |
| --- | --- | --- |
| `MyProfilePage.title` (change) | My profile | Mi perfil |
| `MyProfilePage.eyebrow` | My profile | Mi perfil |
| `MyProfilePage.contactFooter` | These come from your church’s member record. If something is wrong, ask an admin or elder to update it. | Estos datos vienen del registro de miembros de tu iglesia. Si algo está mal, pide a un administrador o anciano que lo actualice. |
| `MyProfilePage.groupsTitle` | My groups & roles | Mis grupos y roles |
| `MyProfilePage.groupsEmptyBody` | Your groups and roles show up here when you join one. | Tus grupos y roles aparecerán aquí cuando te unas a uno. |
| `MyProfilePage.accountEyebrow` | Account | Cuenta |
| `MyProfilePage.accountTitle` | Sign-in details | Datos de acceso |
| `MyProfilePage.accountCreated` | Account created | Cuenta creada |
| `MyProfilePage.accountFooter` | Your role and access are managed by your church’s admins. | Tu rol y acceso los administran los administradores de tu iglesia. |
| `MyProfilePage.memberEyebrow` | Member | Miembro |
| `MyProfilePage.memberTitle` | Member profile | Perfil de miembro |
| `MyProfilePage.notLinked` | Not linked | Sin vincular |
| `MyProfilePage.notLinkedBody` | Your account isn’t connected to a member of {church}. That’s normal for staff who aren’t members of this church. | Tu cuenta no está vinculada a un miembro de {church}. Es normal para el personal que no es miembro de esta iglesia. |
| `MyProfilePage.notLinkedWhy` | If you are a member, linking your account shows your contact details and small groups here, and lets you submit small group reports. | Si eres miembro, vincular tu cuenta muestra aquí tus datos de contacto y grupos pequeños, y te permite enviar reportes de grupo. |
| `MyProfilePage.linkSelf` | Link from my user record | Vincular desde mi usuario |
| `MyProfilePage.linkSelfHint` | Opens your account in Users, where you can pick your member. | Abre tu cuenta en Usuarios, donde puedes elegir tu miembro. |
| `MyProfilePage.askToLink` | Ask an admin or elder to link your account to your member record. | Pide a un administrador o anciano que vincule tu cuenta con tu registro de miembro. |

Spanish uses "tú", as elsewhere in the app; adjust if `messages/es.json` says otherwise.

## Not in this spec

- Edit profile (name, phone, address) and who may edit which fields.
- Profile photo upload (the header avatar is where it goes).
- Saving the language choice to the user profile (today it's the `ekk_locale` cookie; see
  `ACCOUNT-MENU-AND-LANGUAGE.md`).
- Change password / email, sessions list.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] Signed in as each role (admin, elder, smallGroupLeader, deacon, user): page loads, no
      redirect; group links only where `/groups/{id}` actually opens.
- [ ] Linked and not-linked accounts both checked; admin/elder vs other roles in the not-linked card.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; columns stack below `lg`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; keyboard order makes sense.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
