import "server-only";

import type { ConversationThread } from "@/api/conversations-api/types";

import { ApiError } from "@/api/api-client";

/** The conversation errors the panel tells apart (cross-repo spec, "Errors the staff app tells apart"). */
export type ConversationErrorKind =
  | "notLinked"
  | "stale"
  | "race"
  | "notYours"
  | "deleted"
  | "notOnReport"
  | "generic";

/** Matched on status and a phrase of `detail`, never shown. Anything unknown is `generic`. */
export function getConversationErrorKind(
  error: unknown,
): ConversationErrorKind {
  if (!(error instanceof ApiError)) return "generic";

  const detail = JSON.stringify(error.body ?? "").toLowerCase();

  if (error.status === 409) {
    if (detail.includes("link your account")) return "notLinked";
    if (detail.includes("new comment since you opened")) return "stale";
    if (detail.includes("someone else just started")) return "race";
    if (detail.includes("deleted")) return "deleted";
  }

  if (error.status === 403 && detail.includes("not your comment")) {
    return "notYours";
  }

  if (error.status === 422 && detail.includes("attendance row")) {
    return "notOnReport";
  }

  return "generic";
}

/** The current thread a stale-resolve 409 carries (`conversation`), so the panel re-renders from it. */
export function getStaleConversation(
  error: unknown,
): ConversationThread | null {
  if (!(error instanceof ApiError) || typeof error.body !== "object") {
    return null;
  }

  const conversation = (error.body as { conversation?: unknown } | null)
    ?.conversation;

  return conversation && typeof conversation === "object"
    ? (conversation as ConversationThread)
    : null;
}
