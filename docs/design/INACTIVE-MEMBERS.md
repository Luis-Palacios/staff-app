# Inactive members: status tabs, mark as inactive, reactivate

Implementation spec for **inactive members** (Members, `/members` and `/members/[id]`; Group detail,
`/groups/[id]`), which is new:

- **Members list:** tabs *Active* / *Inactive* / *All* with counts. A *Left* column on the Inactive
  tab, and an *Inactive* badge on the All tab.
- **Member detail, active:** a *Mark as inactive* danger section. Its dialog takes the reason, the
  date they left and a note, and lists what will happen. If the member leads a group, a *Choose a
  new leader first* dialog appears instead.
- **Member detail, inactive:** the *Inactive* pill, a banner with *Reactivate…*, *Past groups*,
  the Account card's *Sign-in off*, and *Status history*.
- **Reactivate dialog:** an optional note and *Turn sign-in back on*.
- **Group detail:** the add-member picker says only active members are listed.

**Decided:** everything in the cross-repo spec `../../../docs/specs/inactive-members.md`
(workspace folder `members-management/docs/specs/`), referred to as *rule N*. The main ones:

- It's a status, never a delete.
- Only `members: setStatus` can deactivate or reactivate, or see reasons, notes and history.
- Deactivating ends every group membership today. Reactivating doesn't restore them.
- A group's leader is blocked until someone else leads.
- Sign-in is turned off by **banning the linked user from here**, right after the API call
  (rule 9). Reactivating unbans only a ban with our reason (rule 10).

**Depends on the API:** `membership-management/docs/INACTIVE-MEMBERS-API-HANDOFF.md` (all four
stages), and auth-server stage 1 (`members: setStatus`). If a stage starts before the API is ready,
note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`inactive-members`**
branch. Before the next stage starts, each stage must:
- lint (`pnpm lint`) and type-check (`pnpm exec tsc --noEmit`);
- work in light and dark, at 1440 / 1024 / 390, in English and Spanish.

After each stage, write a short summary of what changed, and anything that differs from the canvas,
in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Members", row *Inactive members · leaving and coming back*. Its blue rules note matches the
  spec.
- **Boards:**
  - `Members-Inactive` (Inactive tab), `Members-All` (All tab), `Members` (Active tab, unchanged
    columns)
  - `MemberDetail-Deactivate` (dialog), `MemberDetail-DeactivateLeader` (blocked)
  - `MemberDetail-Inactive`, `MemberDetail-Inactive-Dark` (with the *marked inactive* toast)
  - `MemberDetail-Reactivate` (dialog)
  - `MemberDetail` (the *Mark as inactive* section at the end of the right column)
  - `GroupDetail-AddMember` (picker hint)
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).
  No new tokens.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Permission, API client, types, actions | ✅ | see `git log` |
| 2. Members list | ✅ | see `git log` |
| 3. Member detail: inactive state | ✅ | see `git log` |
| 4. Dialogs: mark as inactive, leader block, reactivate | ✅ | see `git log` |
| 5. Group detail picker hint | ✅ | see `git log` |
| 6. Design review fixes | ✅ | see `git log` |

### Decisions and deviations

- **Stage 1.** `listMembers(status = "active")` now always sends `?status=`. The callers that
  resolve who a user is linked to (Users list, user detail, the member account loader, the
  link pickers) pass `"all"`, since an inactive member keeps their `userId`. The "members to link
  to this user" picker drops inactive members (rule 11; the API would answer 409).
- The actions return `{ ok: false, code?, groups?, error }`: `error` is the translated message, as
  the account actions do, so a dialog can show it without mapping. `member_inactive` is mapped in
  `getApiErrorMessage` by the 409 `code`, as the spec asks.
- **Stage 2.** The list fetches `status=all`; tab, account filter and search all run in the
  browser. Status counts follow the search; account counts follow the search *and* the status tab.
  *Sign-in off* in the Account column comes from one `listUsers` call, made only for admins and
  elders and only when an inactive member has a linked user. The reason chip is empty (not
  rendered) without `members: setStatus`, since the API sends no reason. Dates use
  `formatCalendarDate` (date-only, no time-zone shift), not `LocalDate`. `InitialsAvatar` got a
  `muted` prop and `DataTablePrimaryCell` got `badge` / `mutedAvatar`.
- **Stage 3.** Left for stage 4 so nothing ships as a dead button: the banner's *Reactivate…*,
  and the *Mark as inactive* danger section (both open the stage 4 dialogs). The banner already
  hides the reason without `setStatus`. *Turn off sign-in* is live now (it is the same `banUser`
  call the dialog will make) and shows only when the caller has `user: ban` and isn't the user.
  The *Sign-in off* explanation says "turned off on {date}" using the member's *left* date, since
  auth-server doesn't expose when the ban happened; a ban with another reason gets a different
  line (`signInOffOther`) instead of claiming we did it. History falls back to the changing
  user's name from the user list when no member is linked to them (`loadStatusHistory`).
  An invited-but-inactive member keeps *Cancel invite* but loses *Link*.
- **Stage 4.** The danger section lives in `mark-inactive-section.tsx` and the banner button in
  `reactivate-member-button.tsx` (client), not in `member-status-card.tsx`, which stays a server
  component for the history. Both dialogs finish by `router.replace("/members/{id}?saved=…")`
  (`inactive`, `inactiveBanFailed`, `reactivated`, `reactivatedUnbanFailed`) and the page renders
  the toast, since the section and banner that opened the dialog are gone once the status flips.
  `SavedToast` got a `warning` tone (gold icon on the navy bar; no new token). The leader block
  shows as soon as the page's own groups say they lead; the API's `leads_group` 409 opens the same
  dialog. Extra `ApiErrors` messages for the other 409 `code`s (`self`, `already_*`) and the 422
  future date, so the dialog never shows the generic line for them. The *Turn sign-in back on*
  checkbox only appears when the caller may ban users and the user is banned; a ban with another
  reason shows it unchecked and disabled. **Not done:** returning focus to the banner's
  *Reactivate…* after deactivating (the page reloads, so focus resets to the document).
- **Stage 5.** The hint sits under the results inside the combo box popover. *Show N past members*
  is left out, as the spec says (needs group history from the API).
- **Stage 6 (checked in the browser against the real API and auth-server).**
  Verified: deactivate (member with and without a linked user), the leader block, reactivate with
  and without the unban, the ban reason stored as `Member marked inactive`, the *Sign-in still on*
  retry, all three list tabs, past groups, status history. 1440 (light, Spanish), 1024 (dark,
  Spanish, in a 1024px frame) and 400 (dark, Spanish; light, English). Without `members:
  setStatus` (signed in as a small group leader): no danger section and no Account card on a
  member page, and `/members` is the 404 page. Fixes made: the dialogs scroll on short screens
  (the `<form>` wrapper stopped the body shrinking), inactive cards no longer overflow on mobile,
  and the *What happens* box has a border so it shows in dark mode.
- **Not checked:** the inactive banner, reason and history as seen by a caller with
  `members: view` + `all` but no `setStatus` (a leader never sees an inactive member: rule 12), and
  focus returning to the banner's *Reactivate…* after deactivating (the page reloads, so it is
  not done). The 1024px check used an iframe, since the browser window couldn't be resized.
- **For membership-management:** `pastSmallGroups` takes the member's latest `member_inactive`
  `left_at`, so a second deactivation that ended no groups still lists the periods from an earlier
  one. It should come from the latest deactivation itself (e.g. its `member_status_changes` row).
- `MemberOption.status` is optional: only `/members/search` sends it.

## Token changes

None. Inactive surfaces reuse the neutral badge, the muted avatar and the existing danger outline
(the same as *Close this group*).

## The API

From the cross-repo spec's *Contracts*:

- `POST /members/{id}/deactivate`
  - Body `{ reason, effectiveDate, note? }` → `MemberDetail`.
  - 409 `code`: `already_inactive`, `leads_group` (+ `groups: [{ id, name }]`), `self`.
  - 422 for a future date.
- `POST /members/{id}/reactivate`
  - Body `{ note? }` → `MemberDetail`.
  - 409 `already_active`.
- `GET /members/{id}/status-history`
  - Returns `[{ status, reason, effectiveDate, note, changedByUserId, changedByName, createdAt }]`.
- `GET /members?status=active|inactive|all`
  - Rows gain `status`, `inactiveSince`, `inactiveReason`.
- `GET /members/{id}` gains:
  - `status`, `inactiveSince`
  - `inactiveReason`, `inactiveNote` (null without `setStatus`)
  - `pastSmallGroups`
- `GET /members/search` rows gain `status`.
- Adding to a group and linking a user can now be 409 `member_inactive`. Map it to a clear message;
  it should only happen on a stale page.

## Stage 1: permission, API client, types, actions

- `lib/auth/permissions.ts`: add `"setStatus"` to the `members` union.
- `api/members-api/`:
  - types: `MemberStatus`, `MemberInactiveReason` (the six values), the new fields, `MemberStatusChange`;
  - client: `deactivateMember`, `reactivateMember`, `getMemberStatusHistory`, and the `status`
    param on the list.
- `app/(app)/members/_actions/`: server actions `deactivateMemberAction` and
  `reactivateMemberAction`.
  - Each checks `members: setStatus` before calling the API (*permissions rule 7*).
  - Each returns `{ ok: true, member }` or `{ ok: false, code, groups? }` so the dialog can branch.
  - Use `revalidatePath` for `/members` and the member.
- `lib/members/`: `MEMBER_INACTIVE_BAN_REASON = "Member marked inactive"` (rule 9), with a comment
  saying reactivation matches on it exactly (rule 10). Don't translate it: it's stored in
  auth-server and compared.
- Extend the member-account loader (`_lib/load-member-account.ts`) to return the linked user's
  `banned` and `banReason`, which `/admin/get-user` already returns.

## Stage 2: Members list (`/members`)

**Files:** `_components/members-list.tsx`, `members-browser.tsx`, `members-summary-table.tsx`,
`member-card-summary.tsx`.

- Fetch with `status=all` once, and filter by tab in the browser, like the account filter and search
  today ("The API has no filter parameters" comment: update it).
- Tabs use `StatusTabs`:
  - *Active* (default), *Inactive*, *All*, each with a count.
  - Kept in the URL as `?status=` with `replaceState`, as `?account=` does. *Active* removes the
    param.
  - The tabs come first in the toolbar, then search, then the account filter.
- Inactive tab:
  - the Account column and account filter are hidden;
  - a **Left** column shows the date (`LocalDate`) over a neutral reason chip;
  - the sub-line stays "Member #id".
- All tab:
  - inactive rows get a neutral *Inactive* badge after the name, with a hollow dot;
  - the sub-line reads "Member #id · Left {date}";
  - the avatar is muted;
  - an inactive member with a banned user shows *Sign-in off* in the Account column.
- Below `md`, the cards show the same badge and the Left line.
- Intro copy changes (see *Copy*). An empty tab uses the existing empty state, with a per-tab line.
- Inactive rows link to the same member page.

## Stage 3: Member detail, inactive state (`/members/[id]`)

**Files:** `member-detail-header.tsx`, `member-groups-card.tsx`, `member-account-card.tsx`,
`member-account-actions.tsx`, new `member-status-card.tsx` (danger section and history), new
`member-inactive-banner.tsx`.

- **Header** when inactive:
  - a neutral *Inactive* pill after the account pill;
  - the meta line reads "Inactive since {date}" instead of the group count;
  - the avatar uses the muted style.
- **Banner** (inactive only), under the header, full width:
  - "{name} is an inactive member";
  - "Left {date} · **{reason}**. …"; the reason part only with `setStatus`;
  - *Reactivate…* (primary), only with `setStatus`.
- **Small groups card:**
  - when inactive, the title is *Past groups*;
  - rows come from `pastSmallGroups`, with "{joined} – {left} · Ended when marked inactive" and a
    neutral role chip.
- **Account card** when inactive:
  - Linked and banned: the status pill shows *Sign-in off* (danger tone), with the explanation line.
  - Linked and **not** banned (the ban failed, rule 9): a warning line *Sign-in is still on* and a
    *Turn off sign-in* button. It uses the same ban as the dialog, shown if
    `userAccountAccess(...).ban`.
  - No account: link and invite are replaced by the line *Inactive members can't be invited or
    linked…*.
- **Right column, last:**
  - Active with `setStatus`: the *Mark as inactive* danger section (same look as *Close this group*).
  - Inactive with `setStatus`: the **Status history** card, from `getMemberStatusHistory`, newest
    first:
    - title *Marked inactive* + reason chip, or *Reactivated*;
    - "{effectiveDate} · by {changedByName ?? the user's name ?? Someone}";
    - the note.
    - Footer: the lock line.
- Without `setStatus`: the pill and "Inactive since" only. No banner action, reason, history or
  danger section.

## Stage 4: dialogs

All three open from the page and use the existing dialog shell. Focus starts on the first field, or
on the primary button for the leader block. Esc and Cancel close.

**Mark as inactive** (`MemberDetail-Deactivate`):
- **Fields:**
  - Reason: select, required, no default selected in the real form (the board shows one picked).
  - *Date she/he left*: date field, defaults to today, max today.
  - Note: optional, 1000 characters max, with the hint.
- **What happens** box:
  - "Leaves N small groups today" with their names and roles; omit the line when N = 0;
  - "Sign-in is turned off", only when a user is linked;
  - "Moves to Inactive".
- **Submit:**
  1. Call `deactivateMemberAction`.
  2. On `leads_group`, switch to the leader-block dialog with the returned groups.
  3. On `ok` with a linked user, call `authClient.admin.banUser({ userId, banReason:
     MEMBER_INACTIVE_BAN_REASON })`, as `user-account-actions.tsx` does.
  4. Ban fails: close, toast a **warning** ("Marked inactive, but sign-in couldn't be turned off"),
     and the Account card shows the retry (stage 3).
  5. Ban succeeds: toast "{name} marked inactive".
  6. Then `router.refresh()`.
- **Pending:** the submit button shows pending, and nothing can close the dialog mid-flight.

**Choose a new leader first** (`MemberDetail-DeactivateLeader`):
- An alertdialog listing each group, with *Change leader* linking to `/groups/[id]`, where the
  leader swap lives.
- The one footer button is *Close*.
- Also open it straight away, without calling the API, when the member's current groups (already on
  the page) show them as leader. The API stays the guard.

**Reactivate** (`MemberDetail-Reactivate`):
- Note: optional.
- *Turn sign-in back on*: a checkbox, checked by default, shown only when a user is linked and
  `banned`.
  - If the ban reason isn't exactly `MEMBER_INACTIVE_BAN_REASON`, show it unchecked and disabled,
    with "This account was banned for another reason. Manage it from Users."
- The info line: groups aren't restored.
- **Submit:**
  1. `reactivateMemberAction`.
  2. Then, if checked, `authClient.admin.unbanUser`.
  3. A failed unban toasts a warning.
- Toast "{name} reactivated".

## Stage 5: Group detail (`/groups/[id]`)

- In the add-member dialog, under the results: "Only active members are listed." The API already
  filters `options`.
- The board's *Show N past members* toggle is **not** in this stage: it needs group history from
  the API (spec, *Not in this spec*). Leave it out and note it in the log.

## Copy

All new UI text, both languages (see "Adding UI text" in `CLAUDE.md`). The keys are suggestions;
follow the existing namespace per component.

| Namespace.key | English | Español |
| --- | --- | --- |
| `MembersPage.description` | Everyone who is or has been a member of this church. Inactive members are kept apart: they're left out of small groups and messages, but their history stays. | Todos los que son o han sido miembros de esta iglesia. Los miembros inactivos se mantienen aparte: quedan fuera de los grupos pequeños y de los mensajes, pero su historial se conserva. |
| `MembersBrowser.statusActive` | Active | Activos |
| `MembersBrowser.statusInactive` | Inactive | Inactivos |
| `MembersBrowser.statusAll` | All | Todos |
| `MembersBrowser.columnLeft` | Left | Salió |
| `MembersBrowser.leftOn` | Left {date} | Salió el {date} |
| `MemberStatus.inactive` | Inactive | Inactivo |
| `MemberStatus.inactiveSince` | Inactive since {date} | Inactivo desde el {date} |
| `MemberStatus.reason.moved_away` | Moved away | Se mudó |
| `MemberStatus.reason.transferred` | Transferred to another church | Se trasladó a otra iglesia |
| `MemberStatus.reason.stopped_attending` | Stopped attending | Dejó de asistir |
| `MemberStatus.reason.church_discipline` | Church discipline | Disciplina eclesiástica |
| `MemberStatus.reason.deceased` | Deceased | Falleció |
| `MemberStatus.reason.other` | Other | Otro |
| `MemberInactiveBanner.title` | {name} is an inactive member | {name} es un miembro inactivo |
| `MemberInactiveBanner.body` | Left {date} · {reason}. They're not in any small group, can't sign in, and are left out of member lists and messages. Their history stays below. | Salió el {date} · {reason}. No está en ningún grupo pequeño, no puede iniciar sesión y queda fuera de las listas de miembros y de los mensajes. Su historial se conserva abajo. |
| `MemberInactiveBanner.reactivate` | Reactivate… | Reactivar… |
| `MemberGroupsCard.pastTitle` | Past groups | Grupos anteriores |
| `MemberGroupsCard.endedInactive` | {from} – {to} · Ended when marked inactive | {from} – {to} · Terminó al marcarse inactivo |
| `MemberStatusCard.dangerTitle` | Mark as inactive | Marcar como inactivo |
| `MemberStatusCard.dangerBody` | For someone who has left the church. They leave their small groups today and their sign-in is turned off. Nothing is deleted, and you can reactivate them later. | Para alguien que ya no es parte de la iglesia. Sale de sus grupos pequeños hoy y se le quita el acceso. No se borra nada, y puedes reactivarlo después. |
| `MemberStatusCard.dangerButton` | Mark as inactive… | Marcar como inactivo… |
| `MemberStatusCard.historyEyebrow` | Membership | Membresía |
| `MemberStatusCard.historyTitle` | Status history | Historial de estado |
| `MemberStatusCard.markedInactive` | Marked inactive | Marcado como inactivo |
| `MemberStatusCard.reactivated` | Reactivated | Reactivado |
| `MemberStatusCard.by` | {date} · by {name} | {date} · por {name} |
| `MemberStatusCard.someone` | Someone | Alguien |
| `MemberStatusCard.privateHint` | Only admins and elders see reasons and notes. | Solo los administradores y ancianos ven los motivos y las notas. |
| `DeactivateMemberDialog.title` | Mark {name} as inactive | Marcar a {name} como inactivo |
| `DeactivateMemberDialog.description` | For someone who has left the church. Nothing is deleted. | Para alguien que ya no es parte de la iglesia. No se borra nada. |
| `DeactivateMemberDialog.reason` | Reason | Motivo |
| `DeactivateMemberDialog.reasonPlaceholder` | Choose a reason | Elige un motivo |
| `DeactivateMemberDialog.date` | Date they left | Fecha en que salió |
| `DeactivateMemberDialog.dateHint` | Today or earlier. | Hoy o antes. |
| `DeactivateMemberDialog.note` | Note (optional) | Nota (opcional) |
| `DeactivateMemberDialog.noteHint` | Only admins and elders can see the reason and note. | Solo los administradores y ancianos pueden ver el motivo y la nota. |
| `DeactivateMemberDialog.whatHappens` | What happens | Qué pasará |
| `DeactivateMemberDialog.leavesGroups` | Leaves {count, plural, one {# small group} other {# small groups}} today | Sale de {count, plural, one {# grupo pequeño} other {# grupos pequeños}} hoy |
| `DeactivateMemberDialog.leavesGroupsBody` | {groups}. Their time in each stays in their history. | {groups}. Su tiempo en cada uno queda en su historial. |
| `DeactivateMemberDialog.signInOff` | Sign-in is turned off | Se quita el acceso |
| `DeactivateMemberDialog.signInOffBody` | {email} can't sign in until they're reactivated. | {email} no podrá iniciar sesión hasta que se reactive. |
| `DeactivateMemberDialog.movesToInactive` | Moves to Inactive | Pasa a Inactivos |
| `DeactivateMemberDialog.movesToInactiveBody` | Left out of the member list, group pickers and messages to members. Their reports, notes and history stay. | Queda fuera de la lista de miembros, de los selectores de grupos y de los mensajes a miembros. Sus reportes, notas e historial se conservan. |
| `DeactivateMemberDialog.submit` | Mark as inactive | Marcar como inactivo |
| `DeactivateMemberDialog.toast` | {name} marked inactive | {name} marcado como inactivo |
| `DeactivateMemberDialog.banFailedToast` | Marked inactive, but sign-in couldn't be turned off | Marcado como inactivo, pero no se pudo quitar el acceso |
| `LeaderBlockDialog.title` | Choose a new leader first | Primero elige un nuevo líder |
| `LeaderBlockDialog.body` | {name} leads the group below. A group can't be left without its leader, so make someone else the leader, then come back to mark them inactive. | {name} dirige el grupo de abajo. Un grupo no puede quedarse sin líder, así que nombra a otra persona como líder y luego vuelve para marcarlo como inactivo. |
| `LeaderBlockDialog.changeLeader` | Change leader | Cambiar líder |
| `LeaderBlockDialog.otherRoles` | Co-leader and member roles don't block this. They just leave those groups. | Los roles de colíder y miembro no lo impiden. Simplemente sale de esos grupos. |
| `ReactivateMemberDialog.title` | Reactivate {name} | Reactivar a {name} |
| `ReactivateMemberDialog.description` | They're back in Members as active from today. | Vuelve a Miembros como activo desde hoy. |
| `ReactivateMemberDialog.notePlaceholder` | For example: moved back and started coming again | Por ejemplo: regresó y volvió a asistir |
| `ReactivateMemberDialog.signInBack` | Turn sign-in back on | Volver a dar acceso |
| `ReactivateMemberDialog.signInBackBody` | {email} can sign in again with the role they had ({role}). | {email} podrá iniciar sesión de nuevo con el rol que tenía ({role}). |
| `ReactivateMemberDialog.bannedOther` | This account was banned for another reason. Manage it from Users. | Esta cuenta fue bloqueada por otro motivo. Adminístrala desde Usuarios. |
| `ReactivateMemberDialog.groupsNotRestored` | They don't go back into their old small groups. Add them to a group from the group's page when they're ready. | No vuelve a sus grupos pequeños anteriores. Agrégalo a un grupo desde la página del grupo cuando esté listo. |
| `ReactivateMemberDialog.submit` | Reactivate | Reactivar |
| `ReactivateMemberDialog.toast` | {name} reactivated | {name} reactivado |
| `MemberAccountCard.signInOff` | Sign-in off | Sin acceso |
| `MemberAccountCard.signInOffBody` | Sign-in was turned off on {date}, when {name} was marked inactive. Reactivating can turn it back on. | El acceso se quitó el {date}, cuando {name} se marcó como inactivo. Al reactivarlo se puede volver a dar. |
| `MemberAccountCard.signInStillOn` | Sign-in is still on. Turn it off so they can't sign in. | El acceso sigue activo. Quítalo para que no pueda iniciar sesión. |
| `MemberAccountCard.turnOffSignIn` | Turn off sign-in | Quitar acceso |
| `MemberAccountCard.inactiveNoAccount` | Inactive members can't be invited or linked. Reactivate them first to give them sign-in access. | A los miembros inactivos no se les puede invitar ni vincular. Reactívalo primero para darle acceso. |
| `GroupMembers.onlyActive` | Only active members are listed. | Solo se muestran los miembros activos. |
| `ApiErrors.member_inactive` | This member is inactive. Reactivate them first. | Este miembro está inactivo. Reactívalo primero. |

The boards use "she" for the sample member; the copy is neutral. Check the Spanish against the
gendered patterns the app already uses (e.g. *Invitados*) and adjust in one place.

## Not in this spec

- *Show N past members* on Group detail (needs API history).
- Coming back through a membership application, bulk actions, reports by reason, and emails to
  active members (spec, *Not in this spec*).

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; list pages switch table → cards
      below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Status shows a dot and a word (*Inactive*, *Sign-in off*), never color alone.
- [ ] Focus ring visible on every control; focus after each dialog returns to the button that
      opened it, or to the banner's *Reactivate…* after deactivating.
- [ ] Without `members: setStatus`: no danger section, no banner action, no reason, no history.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
