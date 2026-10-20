# Report conversations: panel on Report detail, Conversations inbox, dashboard blocks

Implementation spec for **report conversations** (Report detail `/groups/reports/[id]`, a new
**Conversations** nav item `/conversations`, and both dashboards), which is **new** today:

- **Report detail:** a Conversation column on the attendance table (a bubble on each phone card)
  showing none / open / needs your reply / resolved, plus a summary above the table
  ("3 conversations · 1 needs your reply").
- **Conversation panel:** opens from a row. Side panel at ≥ 1024, bottom sheet below. The same
  panel with 0 comments (opens on the composer) or N (thread + reply). Resolve / Reopen, edit and
  delete your own comments, a "New" divider at the first unread comment.
- **Conversations inbox:** tabs *Needs my reply* / *Open* / *Resolved*, group filter, newest first;
  a row opens the report with that person's panel.
- **Sidebar:** Conversations item with a gold badge = needs my reply.
- **Dashboards:** "Waiting for your reply" block at the top of the leader dashboard and the
  elder/admin Groups dashboard, up to 3 rows, hidden when empty.
- **Delete report dialog:** says how many conversations go with it.

**Decided:** see `../docs/specs/report-conversations.md` (rules 1–16). In short: one thread per
attendance row, any row; same audience as observations; commenting needs a linked member; plain
text ≤ 4000; edit/delete own only; any participant resolves; closed groups still allow comments;
**no email in this handoff** (Part 2 comes later and is worked one change at a time).

**Depends on the API:** `membership-management/docs/REPORT-CONVERSATIONS-API-HANDOFF.md`
(stages 1–4 before this stage 2; stage 5's `conversationCount` before this stage 2's dialog
change). If a stage here starts before the API is ready, note it and stub nothing in committed
code.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`report-conversations`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and Spanish,
before the next one starts. After each stage, write a short summary in the progress log.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Report conversations"** (and its blue rules sticky). On page "Small group reports" every
  ReportDetail board now has the Conversation column; the Sidebar and the LeaderDashboard boards
  were updated too.
- **Boards:** `ReportDetail-Thread` (elder reads a new reply), `ReportDetail-ThreadNew` (elder
  starts one), `ReportDetail-Thread-Leader` (leader replying, draft in the composer),
  `ReportDetail-Thread-Resolved`, `ReportDetail-Thread-Phone` (bottom sheet),
  `ReportDetail-Thread-Dark-ES`, `ThreadPanel` (component; Tweaks: viewer, topic, size),
  `Conversations` (elder, needs my reply), `Conversations-Open`, `Conversations-Leader`,
  `Conversations-Empty`, `Conversations-Phone`, `Conversations-Dark-ES`, `ReportDetail`,
  `ReportDetail-Phone`, `LeaderDashboard`, `LeaderDashboard-Elder`, `Sidebar`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API types, client and server actions | ⬜ | |
| 2. Report detail: Conversation column, phone bubbles, summary, delete dialog | ⬜ | |
| 3. Conversation panel and sheet | ⬜ | |
| 4. Conversations page, nav item and badge | ⬜ | |
| 5. Dashboard blocks | ⬜ | |
| 6. Design review fixes | ⬜ | |

### Decisions and deviations

- (fill in per stage)

## Token changes

None expected. The boards use existing tokens: `accent-soft` (open), the warning pair (needs your
reply), the success pair (resolved), gold `#F2B544` only as the unread dot and badge fill (never as
text on light), and a focused-row tint. If the focused row needs a new token (the boards use a pale
gold, `#FFF8E8` light / gold at 8% dark), add it in `tokens/` in its own first commit and note it.

## The API

Shapes in the API handoff. Client functions in `api/small-groups-api/client.ts` (or a new
`api/conversations-api/` if it reads better; note it), types in `types.ts`:

| Function | Route |
| --- | --- |
| `listReportConversations(reportId)` | `GET /small-group-reports/{id}/conversations` |
| `getConversation(reportId, memberId)` | `GET …/conversations/{memberId}` (404 `No conversation yet` → `null`) |
| `addComment(reportId, memberId, body)` | `POST …/conversations/{memberId}/comments` |
| `editComment(commentId, body)` · `deleteComment(commentId)` | `PATCH` / `DELETE /report-conversation-comments/{id}` |
| `resolveConversation(id)` · `reopenConversation(id)` | `POST /report-conversations/{id}/resolve` · `/reopen` |
| `markConversationRead(id)` | `POST /report-conversations/{id}/read` |
| `listConversations({ tab, smallGroupId, limit, offset })` | `GET /report-conversations` |
| `getConversationCounts()` | `GET /report-conversations/counts` |

Server actions in `app/(app)/groups/reports/_actions/conversation-actions.ts`; every one checks the
same permission as the page before calling the API (roles-and-permissions rule 7). Errors mapped
to message keys:

| API | Key |
| --- | --- |
| 409 `Link your account` | `Conversations.errors.notLinked` |
| 403 `not your comment` | `Conversations.errors.notYours` |
| 409 `deleted` | `Conversations.errors.deleted` |
| 422 `attendance` | `Conversations.errors.notOnReport` (reload the page) |
| anything else | `Conversations.errors.generic` |

**Who sees the feature:** the same check that shows observations on Report detail (observations
visible = `viewObservations` or leads the group). Use one helper, e.g.
`canSeeConversations(permissions, leadsGroup)` in `lib/auth/permissions.ts`, for the column, the
panel, the nav item and the dashboard blocks.

## Stage 1: API types, client and server actions

- Types, client functions and actions above. `addComment` returns the thread so the panel updates
  without a refetch; the others too.
- Revalidate the report detail path and `/conversations` after writes.

## Stage 2: Report detail (`/groups/reports/[id]`)

**Files:** `_components/report-attendance-table.tsx`, `report-attendance-card.tsx`, the detail
page, `delete-report-dialog.tsx`.

- Fetch `listReportConversations` alongside the report; map by `anchor.memberId`.
- **Table:** a right-aligned *Conversation* column after Observation. Cell states (board
  `ReportDetail`):
  - none: 40×40 muted icon link, bubble with a plus; `aria-label` "Start a conversation about
    {first}";
  - open: pill with bubble icon + count, `accent-soft`;
  - needs your reply / unread: pill in the warning pair + a gold dot (`unread` drives the dot,
    `needsMyReply` the color);
  - resolved: pill with a check + count, success pair.
  Each is a link to `?person={memberId}` (shallow, keeps scroll). Footer cell: "3 conversations".
- **Phone cards:** the same states as a 44px control at the right of the name line.
- **Summary** in the attendance header, above the privacy line: "N conversations" pill + "N needs
  your reply" pill (hidden at 0); the whole thing hidden when there are none.
- **Privacy line** copy changes (Copy table).
- **Delete dialog:** when `conversationCount > 0`, add "This also deletes {count} conversations."
- No-meeting reports: no column, no summary.

## Stage 3: Conversation panel (`?person=`)

**Files:** `_components/conversation-panel.tsx` (+ `conversation-comment.tsx`,
`conversation-composer.tsx`), wired into the detail page.

- **Container:** ≥ 1024: a right-hand panel, 460px (420px at 1024), full viewport height, fixed,
  non-modal (the table stays usable; Escape and the × close it, focus returns to the row's
  control). The row gets the focused tint and a 3px gold inset edge on its left. < 1024: a bottom
  sheet (HeroUI `Drawer`/`Modal` placement bottom), modal, top 64px from the viewport, drag handle,
  scrim.
- **Header:** "Conversation" eyebrow + status pill (New / Open / Resolved), **Resolve** (open) or
  **Reopen** (resolved), close ×. Avatar, person's name (serif), "{group} · Report for {date}".
- **Context box:** the meeting and church pills from the row, and the observation (lock icon,
  "Observation by {submitter}", italic serif) or "No observation for {first} in this report."
- **Thread:** comments oldest first. Avatar initials (elders' side in the warning pair, leaders'
  side in `accent-soft`), name, role word (Elder / Leader / Co-leader, from `author.side` + the
  group roles you already have), time, "· edited". Own comments get a ⋯ menu: **Edit** (inline
  textarea, Save / Cancel) and **Delete** (confirm in the menu, no dialog). Deleted comments render
  as the dashed stub "Comment deleted · {date}". A "New" divider goes before
  `firstUnreadCommentId`. Resolved threads end with the success banner "Resolved by {name} ·
  {date}".
- **Empty (no thread):** icon, "No conversation yet", the explanation, composer focused,
  button **Start conversation**.
- **Composer:** textarea (3 rows, grows), label visually hidden, placeholder per state, counter
  only past 3600 chars; **Reply** / **Start conversation** disabled while empty; ⌘/Ctrl+Enter sends.
  Under it, a one-line note of who will see it (Copy table; no email is sent yet, so v1 copy
  says who *sees* it, not who gets an email; the boards' email wording comes with Part 2).
  A resolved thread's placeholder says replying reopens it.
- **Mark read** when the panel opens on an existing thread (`markConversationRead`), then refresh
  the row's indicator.
- **Not linked** (admin/elder without a member): the composer area is replaced by the note
  `Conversations.errors.notLinked` with a link to My profile; Resolve/Reopen hidden.
- **Errors** show inline above the composer (`role="alert"`), the draft kept.
- Keep the unsent draft per thread in `sessionStorage` (try/catch), cleared on send.

## Stage 4: Conversations page (`/conversations`) and nav

**Files:** `app/(app)/conversations/page.tsx`, `_components/conversations-list.tsx`,
`config/site.ts`, the sidebar.

- Nav: top-level **Conversations** after Dashboard, chat-bubbles icon, visible per the helper
  above; the page is `notFound()` when it fails. Badge: `getConversationCounts().needsMyReply`,
  gold fill, navy text, hidden at 0, `aria-label` "{n} waiting for your reply". Fetch it once per
  request (`cache()`), next to the session.
- Header: eyebrow "Small group reports", title, subtitle per role (board copy).
- Tabs (URL `?tab=reply|open|resolved`, default `reply`) with counts; the *Needs my reply* count is
  gold when > 0. Group select (`?group=`): elders see all open and closed groups that have threads,
  leaders their groups.
- Rows (one card, divided list): avatar with unread dot, name (bold when unread) + status pill,
  "{group} · Report for {date}" (+ Closed pill), excerpt "{author}: {text}" clamped to 2 lines
  ("You:" for your own; resolved rows show "Resolved by {name}." + excerpt), time and comment
  count on the right. Unread rows get the faint warm background. Whole row is a link to
  `/groups/reports/{reportId}?person={memberId}`.
- Paging: "Show more" (25 at a time).
- Empty (*Needs my reply*): "You're all caught up" card + link to *Open*. Other tabs: a plain empty
  line.
- Phone: tabs scroll sideways, the group select goes full width.

## Stage 5: Dashboard blocks

**Files:** `app/(app)/_components/leader-dashboard.tsx`, `groups-dashboard.tsx`, a shared
`waiting-for-reply-card.tsx`.

- Top of the page under the greeting: "Waiting for your reply" + gold count, subtitle per role,
  **All conversations** link, up to 3 rows (`listConversations({ tab: "reply", limit: 3 })`):
  avatar + unread dot, name, "{group} · {date}", one-line excerpt, time. Hidden when empty or when
  the user can't see conversations.

## Stage 6: Design review fixes

Run the checklist below against every listed board; record findings.

## Copy

New keys under `Conversations` (plus the few under existing namespaces). Both languages.

| Key | English | Español |
| --- | --- | --- |
| `Conversations.navLabel` | Conversations | Conversaciones |
| `Conversations.badgeLabel` | {count} waiting for your reply | {count} esperan tu respuesta |
| `Conversations.eyebrow` | Small group reports | Reportes de grupos pequeños |
| `Conversations.title` | Conversations | Conversaciones |
| `Conversations.subtitleElder` | Questions and follow-ups about people in every group’s reports. | Preguntas y seguimiento sobre personas en los reportes de todos los grupos. |
| `Conversations.subtitleLeader` | Elders’ questions and follow-ups about people in the groups you lead. | Preguntas y seguimiento de los ancianos sobre personas en los grupos que lideras. |
| `Conversations.tabReply` | Needs my reply | Esperan mi respuesta |
| `Conversations.tabOpen` | Open | Abiertas |
| `Conversations.tabResolved` | Resolved | Resueltas |
| `Conversations.group` / `allGroups` / `allMyGroups` | Group / All groups / All my groups | Grupo / Todos los grupos / Todos mis grupos |
| `Conversations.reportFor` | Report for {date} | Reporte del {date} |
| `Conversations.you` | You: | Tú: |
| `Conversations.resolvedBy` | Resolved by {name} · {date} | Resuelta por {name} · {date} |
| `Conversations.statusNew` / `statusOpen` / `statusResolved` / `statusReply` | New / Open / Resolved / Needs your reply | Nueva / Abierta / Resuelta / Espera tu respuesta |
| `Conversations.emptyTitle` | You’re all caught up | Estás al día |
| `Conversations.emptyElder` | No conversation is waiting for your reply. When a leader answers, it shows up here and on your dashboard. | Ninguna conversación espera tu respuesta. Cuando un líder responda, aparecerá aquí y en tu inicio. |
| `Conversations.emptyLeader` | No conversation is waiting for your reply. When an elder asks about someone in your groups, it shows up here. | Ninguna conversación espera tu respuesta. Cuando un anciano pregunte por alguien de tus grupos, aparecerá aquí. |
| `Conversations.seeOpen` | See open conversations | Ver conversaciones abiertas |
| `Conversations.showMore` | Show more | Mostrar más |
| `Conversations.panelEyebrow` | Conversation | Conversación |
| `Conversations.resolve` / `reopen` / `close` | Resolve / Reopen / Close conversation | Resolver / Reabrir / Cerrar conversación |
| `Conversations.observationBy` | Observation by {name} | Observación de {name} |
| `Conversations.noObservation` | No observation for {first} in this report. | Sin observación para {first} en este reporte. |
| `Conversations.panelEmptyTitle` | No conversation yet | Aún no hay conversación |
| `Conversations.panelEmptyBody` | Ask a question or leave a note about {first}. Admins, elders and the group’s leaders can read and reply. | Haz una pregunta o deja una nota sobre {first}. Administradores, ancianos y los líderes del grupo pueden leer y responder. |
| `Conversations.newDivider` | New | Nuevo |
| `Conversations.edited` | edited | editado |
| `Conversations.deletedStub` | Comment deleted · {date} | Comentario eliminado · {date} |
| `Conversations.commentOptions` / `edit` / `delete` / `confirmDelete` / `save` / `cancel` | Comment options / Edit / Delete / Delete this comment? / Save / Cancel | Opciones del comentario / Editar / Eliminar / ¿Eliminar este comentario? / Guardar / Cancelar |
| `Conversations.placeholderNew` | Write a question or note about {first}… | Escribe una pregunta o nota sobre {first}… |
| `Conversations.placeholderReply` | Write a reply… | Escribe una respuesta… |
| `Conversations.placeholderResolved` | Reply to reopen… | Responde para reabrir… |
| `Conversations.send` / `start` | Reply / Start conversation | Responder / Iniciar conversación |
| `Conversations.audienceNote` | Admins, elders and the group’s leaders see this conversation. | Administradores, ancianos y los líderes del grupo ven esta conversación. |
| `Conversations.reopenNote` | Replying reopens it. | Responder la vuelve a abrir. |
| `Conversations.roleElder` / `roleLeader` / `roleCoLeader` | Elder / Leader / Co-leader | Anciano / Líder / Colíder |
| `Conversations.startAria` | Start a conversation about {first} | Iniciar una conversación sobre {first} |
| `Conversations.rowAria` | Conversation about {first}: {count, plural, one {# comment} other {# comments}}, {state} | Conversación sobre {first}: {count, plural, one {# comentario} other {# comentarios}}, {state} |
| `Conversations.column` | Conversation | Conversación |
| `Conversations.summaryTotal` | {count, plural, one {# conversation} other {# conversations}} | {count, plural, one {# conversación} other {# conversaciones}} |
| `Conversations.summaryReply` | {count} needs your reply | {count} espera tu respuesta |
| `Conversations.waitingTitle` | Waiting for your reply | Esperan tu respuesta |
| `Conversations.waitingElder` | Leaders answered these conversations about people in their groups. | Los líderes respondieron estas conversaciones sobre personas de sus grupos. |
| `Conversations.waitingLeader` | Elders asked about people in your groups. | Los ancianos preguntaron por personas de tus grupos. |
| `Conversations.all` | All conversations | Todas las conversaciones |
| `Conversations.errors.notLinked` | Link your account to a member to comment. | Vincula tu cuenta con un miembro para comentar. |
| `Conversations.errors.notYours` | You can only change your own comments. | Solo puedes cambiar tus propios comentarios. |
| `Conversations.errors.deleted` | That comment was deleted. | Ese comentario fue eliminado. |
| `Conversations.errors.notOnReport` | This person is no longer on the report. Reload the page. | Esta persona ya no está en el reporte. Recarga la página. |
| `Conversations.errors.generic` | Couldn’t save. Try again. | No se pudo guardar. Inténtalo de nuevo. |
| `ReportDetail.obsPrivacy` (changed) | Observations and conversations are seen only by admins, elders and the group’s leaders. | Las observaciones y conversaciones solo las ven administradores, ancianos y los líderes del grupo. |
| `DeleteReport.conversations` | This also deletes {count, plural, one {# conversation} other {# conversations}}. | También se {count, plural, one {elimina # conversación} other {eliminan # conversaciones}}. |

Use the existing namespaces' real names where these guessed ones differ (`ReportDetail`,
`DeleteReport`); note it under *Decisions*.

## Not in this spec

- Email notifications and the "who gets an email" notes from the boards (Part 2).
- My profile "Conversation emails" toggle (Part 2).
- Member detail conversation history, section threads, @mentions, moderation.
- Real-time updates: the panel and badge refresh on navigation and after your own actions only.

## Design review checklist

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: panel at 1440 and 1024, sheet at 390; nothing clipped, no sideways
      scroll; the table keeps its own scroll box with the panel open.
- [ ] No color, font, radius or shadow literals in the changed files, no new `dark:` overrides a
      token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot or icon and a word.
- [ ] Focus: opening the panel focuses its heading (or the composer when empty); closing returns to
      the row control; the sheet traps focus; ⌘/Ctrl+Enter sends.
- [ ] English and Spanish both fit; `react/jsx-no-literals` clean; plurals right at 1.
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
