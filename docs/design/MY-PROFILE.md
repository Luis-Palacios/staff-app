# My profile: the signed-in user's account and member record

Implemented in PR #61 (`/users/me`, account menu › My profile). This file keeps the decisions;
the code (`app/(app)/users/me/`) and `messages/*.json` hold the rest.

- **Linked:** the signed-in user's member record (contact & personal, small groups and roles)
  plus their sign-in details, in the Member detail layout.
- **Not linked:** sign-in details plus a "Member profile · Not linked" card explaining what
  linking adds; admins and elders get a link to their own User detail to link themselves, everyone
  else is told to ask an admin or elder.

## Decided

- Always the signed-in user. Read-only: no edit, link, unlink or invite actions on this page.
- Every role that can sign in can open it. It must **not** use `loadUser()`: that redirects anyone
  who isn't an admin or elder. `loadMyProfile()` reads the session and `GET /me`, then
  `getMember()` with the id from `/me` only, never an id from the URL.
- No breadcrumb (most roles can't open Users). The header is the person: avatar, "My profile"
  eyebrow, name as `<h1>`, then email, role, and for linked accounts member number and group count.
- No "Status" row: a banned user can't be signed in, so it would always say Active.
- Group rows are links (whole row, chevron) only when the viewer can open `/groups/{id}`:
  `access === "full"`, or `"scoped"` and the viewer leads that group. Otherwise a plain row.
- `AuthSessionUser` declares `createdAt`; it is in the live get-session response.
- A 404 from `getMember` counts as not linked. The link lives on the member row, so a dangling
  link can't exist; this only covers a delete between the two requests.
- Shared cards got optional `variant="self"` (and `canOpen` on the groups card), plus a `stacked`
  prop on the sign-in card. Their default markup is unchanged, so Member detail and Users are too.
- The sidebar highlights nothing on `/users/me` (`isActivePath` in `components/sidebar.tsx`).

## Design

- [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1), page "My profile": boards
  `MyProfile`, `MyProfile-NotLinked`, `MyProfile-Dark`.
- Left as is on purpose after the review: canvas hex values that map to tokens, `StatusBadge`
  padding and dot size and the contact icon tile radius (shared components), sample dates, main
  padding and max-width, and the header meta line gap (8/14 vs 6/20).
- The avatar circle (72px, gap and hairline ring) is where the photo goes later.

## Progress

| Stage | Status |
| --- | --- |
| 1. Loader and session type | ✅ |
| 2. Linked page | ✅ |
| 3. Not-linked page, copy, sidebar | ✅ |
| 4. Design review fixes | ✅ |

Not exercised live: the elder role (same code path as admin, no verified elder test account).

## Not in this spec

- Edit profile (name, phone, address) and who may edit which fields.
- Profile photo upload.
- Saving the language choice to the user profile (today it's the `ekk_locale` cookie; see
  `ACCOUNT-MENU-AND-LANGUAGE.md`).
- Change password / email, sessions list.

## Dev note

If a newly added Tailwind class seems to do nothing in `pnpm dev`, restart the dev server: the CSS
sometimes doesn't pick up a new class until the file is edited again.
