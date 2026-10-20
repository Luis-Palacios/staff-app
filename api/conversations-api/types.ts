// Shapes of membership-management's report conversation routes (camelCase, as sent).
// Comment bodies are plain text; a deleted comment has `body: null`.

export type ConversationStatus = "open" | "resolved";

/** Elders' side = the author had `smallGroups: all` when writing; leaders' side otherwise. */
export type ConversationSide = "elders" | "leaders";

export type ConversationInboxTab = "reply" | "open" | "resolved";

/** What a thread is about. Only attendance rows in v1; sections can come without a client change. */
export interface ConversationAnchor {
  type: "attendance";
  memberId: number;
}

/** One row indicator on Report detail. */
export interface ConversationSummary {
  id: number;
  anchor: ConversationAnchor;
  status: ConversationStatus;
  commentCount: number;
  unread: boolean;
  needsMyReply: boolean;
  lastCommentAt: string;
}

export interface ReportConversations {
  conversations: ConversationSummary[];
  counts: { total: number; needsMyReply: number };
}

export interface ConversationPerson {
  memberId: number;
  name: string;
}

export interface ConversationComment {
  id: number;
  author: ConversationPerson & { side: ConversationSide };
  /** Null when `deleted`: the stored text is never returned again. */
  body: string | null;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  mine: boolean;
}

export interface ConversationThread {
  id: number;
  anchor: ConversationAnchor;
  /** The person the thread is about: there even when their attendance row is gone. */
  member: { id: number; name: string };
  status: ConversationStatus;
  resolvedBy: ConversationPerson | null;
  resolvedAt: string | null;
  /** Never a deleted comment. */
  firstUnreadCommentId: number | null;
  /** Oldest first. */
  comments: ConversationComment[];
}

export interface ConversationInboxItem {
  id: number;
  status: ConversationStatus;
  needsMyReply: boolean;
  unread: boolean;
  member: { id: number; name: string };
  group: { id: number; name: string; closed: boolean };
  report: { id: number; meetingDate: string };
  /** Always present; `deleted` with a null `excerpt` when every comment was deleted. */
  lastComment: {
    authorName: string;
    mine: boolean;
    deleted: boolean;
    /** Cut at 160 characters with no ellipsis. */
    excerpt: string | null;
    createdAt: string;
  };
  resolvedBy: ConversationPerson | null;
  commentCount: number;
}

export interface ConversationInbox {
  items: ConversationInboxItem[];
  /** The whole inbox, whatever `smallGroupId` is. */
  counts: { reply: number; open: number; resolved: number };
  /** Rows in the filtered tab, for "Show more". */
  total: number;
}

export interface ConversationInboxParams {
  tab?: ConversationInboxTab;
  smallGroupId?: number;
  limit?: number;
  offset?: number;
}
