"use server";

import type {
  ConversationAnchor,
  ConversationInbox,
  ConversationInboxParams,
  ConversationThread,
} from "@/api/conversations-api/types";
import type { ConversationErrorKind } from "@/app/(app)/groups/reports/_lib/conversation-errors";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import {
  addComment,
  addSectionComment,
  deleteComment,
  editComment,
  listConversations,
  markConversationRead,
  reopenConversation,
  resolveConversation,
} from "@/api/conversations-api/client";
import {
  getConversationErrorKind,
  getStaleConversation,
} from "@/app/(app)/groups/reports/_lib/conversation-errors";
import { forbiddenUnless } from "@/lib/auth/get-permissions";

const MAX_BODY = 4000;

/** A write that went through carries the thread to render; a failure carries text, never the API's. */
export type ConversationResult =
  | { ok: true; conversation: ConversationThread }
  | {
      ok: false;
      kind: ConversationErrorKind;
      message: string;
      /** Set with `kind: "stale"`: the current thread, to re-render from without a refetch. */
      conversation?: ConversationThread;
    };

export type ConversationInboxResult =
  | { ok: true; inbox: ConversationInbox }
  | { ok: false; message: string };

async function failure(
  kind: ConversationErrorKind,
  conversation?: ConversationThread | null,
): Promise<ConversationResult> {
  const t = await getTranslations("Conversations.errors");

  return {
    ok: false,
    kind,
    message: t(kind),
    ...(conversation && { conversation }),
  };
}

async function toFailure(error: unknown): Promise<ConversationResult> {
  const kind = getConversationErrorKind(error);

  return failure(kind, kind === "stale" ? getStaleConversation(error) : null);
}

/** After a write: the report's panel and indicators, the inbox and the dashboards. */
function revalidateConversations(reportId: number) {
  revalidatePath(`/groups/reports/${reportId}`);
  revalidatePath("/conversations");
  revalidatePath("/");
  revalidatePath("/dashboard/prayer");
}

/** Reading and writing conversations is "can see this report's observations"; the API checks the scope. */
function forbidden() {
  return forbiddenUnless({ smallGroupReports: ["view"] });
}

function isValidBody(body: string): boolean {
  const trimmed = body.trim();

  return trimmed.length > 0 && trimmed.length <= MAX_BODY;
}

/** Starts the thread about `anchor` when there is none, and reopens a resolved one. */
export async function addCommentAction(
  reportId: number,
  anchor: ConversationAnchor,
  body: string,
): Promise<ConversationResult> {
  if (await forbidden()) return failure("generic");
  if (!isValidBody(body)) return failure("generic");

  try {
    const conversation =
      anchor.type === "attendance"
        ? await addComment(reportId, anchor.memberId, body.trim())
        : await addSectionComment(reportId, anchor.key, body.trim());

    revalidateConversations(reportId);

    return { ok: true, conversation };
  } catch (error) {
    return toFailure(error);
  }
}

export async function editCommentAction(
  reportId: number,
  commentId: number,
  body: string,
): Promise<ConversationResult> {
  if (await forbidden()) return failure("generic");
  if (!isValidBody(body)) return failure("generic");

  try {
    const conversation = await editComment(commentId, body.trim());

    revalidateConversations(reportId);

    return { ok: true, conversation };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteCommentAction(
  reportId: number,
  commentId: number,
): Promise<ConversationResult> {
  if (await forbidden()) return failure("generic");

  try {
    const conversation = await deleteComment(commentId);

    revalidateConversations(reportId);

    return { ok: true, conversation };
  } catch (error) {
    return toFailure(error);
  }
}

/** `lastCommentId`: the newest non-deleted comment the panel shows, `null` when there is none. */
export async function resolveConversationAction(
  reportId: number,
  conversationId: number,
  lastCommentId: number | null,
): Promise<ConversationResult> {
  if (await forbidden()) return failure("generic");

  try {
    const conversation = await resolveConversation(
      conversationId,
      lastCommentId,
    );

    revalidateConversations(reportId);

    return { ok: true, conversation };
  } catch (error) {
    return toFailure(error);
  }
}

export async function reopenConversationAction(
  reportId: number,
  conversationId: number,
): Promise<ConversationResult> {
  if (await forbidden()) return failure("generic");

  try {
    const conversation = await reopenConversation(conversationId);

    revalidateConversations(reportId);

    return { ok: true, conversation };
  } catch (error) {
    return toFailure(error);
  }
}

/**
 * Called when the panel opens on an existing thread. A failure is ignored: it only clears a dot.
 * It does not revalidate: closing the panel navigates, which re-renders the page and the dot with it,
 * and revalidating here would re-render the page under the panel the moment it opens.
 */
export async function markConversationReadAction(
  conversationId: number,
): Promise<{ ok: boolean }> {
  if (await forbidden()) return { ok: false };

  try {
    await markConversationRead(conversationId);

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** "Show more" on the Conversations page. */
export async function listConversationsAction(
  params: ConversationInboxParams,
): Promise<ConversationInboxResult> {
  const t = await getTranslations("Conversations.errors");

  if (await forbidden()) return { ok: false, message: t("generic") };

  try {
    return { ok: true, inbox: await listConversations(params) };
  } catch {
    return { ok: false, message: t("generic") };
  }
}
