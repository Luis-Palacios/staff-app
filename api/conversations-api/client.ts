import type { ApiFetchOptions } from "@/api/api-client";
import type {
  ConversationInbox,
  ConversationInboxParams,
  ConversationThread,
  ReportConversations,
} from "@/api/conversations-api/types";
import type { Person, ReportSectionKey } from "@/api/small-groups-api/types";

import { cache } from "react";

import { ApiError } from "@/api/api-client";
import { authenticatedFetch } from "@/api/authenticated-fetch";
import { getEnv } from "@/lib/env/server";

function request<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  return authenticatedFetch<TResponse>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    path,
    { cache: "no-store", ...options },
  );
}

function reportPath(reportId: number | string, suffix = ""): string {
  return `/small-group-reports/${encodeURIComponent(String(reportId))}/conversations${suffix}`;
}

/** A member's thread lives at `/{memberId}`, a guest's at `/guests/{guestId}`. */
function personPath(person: Pick<Person, "type" | "id">): string {
  return person.type === "guest" ? `/guests/${person.id}` : `/${person.id}`;
}

/** The report's threads with the row indicators. */
export function listReportConversations(
  reportId: number | string,
): Promise<ReportConversations> {
  return request<ReportConversations>(reportPath(reportId));
}

/** One person's thread (a member's or a guest's); `null` on 404 `No conversation yet`. */
export async function getConversation(
  reportId: number | string,
  person: Pick<Person, "type" | "id">,
): Promise<ConversationThread | null> {
  try {
    return await request<ConversationThread>(
      reportPath(reportId, personPath(person)),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    throw error;
  }
}

/** Creates the thread when there is none and reopens a resolved one. */
export function addComment(
  reportId: number | string,
  person: Pick<Person, "type" | "id">,
  body: string,
): Promise<ConversationThread> {
  return request<ConversationThread>(
    reportPath(reportId, `${personPath(person)}/comments`),
    { method: "POST", body: { body } },
  );
}

/** One section's thread (prayer & follow-up rule 14); `null` on 404 `No conversation yet`. */
export async function getSectionConversation(
  reportId: number | string,
  key: ReportSectionKey,
): Promise<ConversationThread | null> {
  try {
    return await request<ConversationThread>(
      reportPath(reportId, `/sections/${key}`),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    throw error;
  }
}

/** Creates the section's thread when there is none (422 when the section is empty). */
export function addSectionComment(
  reportId: number | string,
  key: ReportSectionKey,
  body: string,
): Promise<ConversationThread> {
  return request<ConversationThread>(
    reportPath(reportId, `/sections/${key}/comments`),
    { method: "POST", body: { body } },
  );
}

/** Your own comment only (403 otherwise). */
export function editComment(
  commentId: number,
  body: string,
): Promise<ConversationThread> {
  return request<ConversationThread>(
    `/report-conversation-comments/${commentId}`,
    { method: "PATCH", body: { body } },
  );
}

/** Soft delete of your own comment. */
export function deleteComment(commentId: number): Promise<ConversationThread> {
  return request<ConversationThread>(
    `/report-conversation-comments/${commentId}`,
    { method: "DELETE" },
  );
}

/**
 * `lastCommentId` is the newest non-deleted comment the resolver saw (`null` for none). If someone
 * commented since, the API answers 409 with the current thread in `conversation`.
 */
export function resolveConversation(
  id: number,
  lastCommentId: number | null,
): Promise<ConversationThread> {
  return request<ConversationThread>(`/report-conversations/${id}/resolve`, {
    method: "POST",
    body: { lastCommentId },
  });
}

export function reopenConversation(id: number): Promise<ConversationThread> {
  return request<ConversationThread>(`/report-conversations/${id}/reopen`, {
    method: "POST",
  });
}

/** 204. Called when the panel opens, never by a GET. */
export function markConversationRead(id: number): Promise<void> {
  return request<void>(`/report-conversations/${id}/read`, { method: "POST" });
}

/** The inbox; `tab` defaults to `reply` on the API. */
export function listConversations(
  params: ConversationInboxParams = {},
): Promise<ConversationInbox> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }

  const suffix = query.size > 0 ? `?${query}` : "";

  return request<ConversationInbox>(`/report-conversations${suffix}`);
}

/** The sidebar badge. Answers 0, never 403, outside the audience. Cached per render. */
export const getConversationCounts = cache(
  (): Promise<{ needsMyReply: number }> =>
    request<{ needsMyReply: number }>("/report-conversations/counts"),
);
