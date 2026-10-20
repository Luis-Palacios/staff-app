"use client";

import type { ConversationThread } from "@/api/conversations-api/types";
import type { ConversationResult } from "@/app/(app)/groups/reports/_actions/conversation-actions";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button, Drawer } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { ConversationComment } from "./conversation-comment";
import { ConversationComposer } from "./conversation-composer";

import {
  addCommentAction,
  deleteCommentAction,
  editCommentAction,
  markConversationReadAction,
  reopenConversationAction,
  resolveConversationAction,
} from "@/app/(app)/groups/reports/_actions/conversation-actions";
import { initialsOf } from "@/components/initials-avatar";
import { StatusBadge } from "@/components/status-badge";

export interface ConversationPanelPerson {
  memberId: number;
  name: string;
  /** Null when the person has no attendance row on this report any more. */
  onReport: { attendedGroup: boolean; attendedChurch: boolean } | null;
  /** Null when there is none or the caller can't see observations. */
  observation: string | null;
}

export interface ConversationPanelLabels {
  attended: string;
  absent: string;
  atChurch: string;
  notAtChurch: string;
}

const DESKTOP_QUERY = "(min-width: 1024px)";
// Matches `--animate-panel-out` in globals.css.
const CLOSE_MS = 180;

function subscribe(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);

  query.addEventListener("change", callback);

  return () => query.removeEventListener("change", callback);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

function draftKey(reportId: number, memberId: number) {
  return `conversation-draft:${reportId}:${memberId}`;
}

function readDraft(key: string): string {
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // The draft is a convenience.
  }
}

function formatWhen(iso: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

function formatDay(iso: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(iso));
}

function AttendancePill({
  yes,
  yesLabel,
  noLabel,
}: {
  yes: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return yes ? (
    <StatusBadge tone="success">{yesLabel}</StatusBadge>
  ) : (
    <StatusBadge tone="neutral" variant="ring-dot">
      {noLabel}
    </StatusBadge>
  );
}

// The conversation about one person's attendance row, opened from `?person=`. At 1024 and up a
// fixed, non-modal right-hand panel (the table stays usable); below, a modal bottom sheet. The same
// body for 0 comments (opens on the composer) or N (thread, then reply).
export function ConversationPanel({
  reportId,
  groupName,
  meetingDate,
  timeZone,
  submittedBy,
  person,
  initialThread,
  linked,
  roleByMember,
  closeHref,
  labels,
}: {
  reportId: number;
  groupName: string;
  /** Already formatted: "Thu, Oct 8". */
  meetingDate: string;
  timeZone: string;
  submittedBy: string;
  person: ConversationPanelPerson;
  initialThread: ConversationThread | null;
  /** False for an admin or elder with no linked member: they can read, not write (rule 5). */
  linked: boolean;
  /** Leader / co-leader of the group, by member id, to word the leaders' side. */
  roleByMember: Record<number, "leader" | "co_leader">;
  closeHref: string;
  labels: ConversationPanelLabels;
}) {
  const t = useTranslations("Conversations");
  const locale = useLocale();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [thread, setThread] = useState(initialThread);
  const [error, setError] = useState<{ kind: string; message: string } | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [closing, setClosing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const key = draftKey(reportId, person.memberId);
  const first = person.name.split(/\s+/)[0];

  // Draft from this tab's sessionStorage; read after mount so the server render matches.
  useEffect(() => {
    setDraft(readDraft(key));
  }, [key]);

  // Opening on an existing thread marks it read, and its action refreshes the row's dot. The "New"
  // divider keeps showing from the thread loaded here.
  useEffect(() => {
    if (initialThread) {
      // The action revalidates the page, which refreshes the row's dot.
      void markConversationReadAction(reportId, initialThread.id);
    }
    // Once per opened person.
  }, [person.memberId]);

  // Focus: the heading when there's a thread to read, the composer when empty.
  useEffect(() => {
    const target = initialThread ? headingRef.current : composerRef.current;

    target?.focus({ preventScroll: true });
  }, [isDesktop]);

  function close() {
    if (closing) return;

    const leave = () => {
      router.replace(closeHref, { scroll: false });
      // The row's control takes focus back (the panel is gone after the navigation).
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            `[data-conversation-member="${person.memberId}"]`,
          )
          ?.focus(),
      );
    };

    // The desktop panel slides out first (the sheet animates itself); no motion, no wait.
    if (
      isDesktop &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setClosing(true);
      window.setTimeout(leave, CLOSE_MS);
    } else {
      leave();
    }
  }

  // Non-modal: Escape closes it from anywhere on the page (the sheet below has its own).
  useEffect(() => {
    if (!isDesktop) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) close();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDesktop]);

  function apply(result: ConversationResult, onSuccess?: () => void) {
    if (result.ok) {
      setThread(result.conversation);
      setError(null);
      onSuccess?.();
    } else {
      setError({ kind: result.kind, message: result.message });

      if (result.conversation) {
        setThread(result.conversation);
        // The new comment is read first: focus goes to the "New" divider.
        requestAnimationFrame(() =>
          document.getElementById("conversation-new-divider")?.focus(),
        );
      }
    }
  }

  function send() {
    const body = draft;

    startTransition(async () => {
      apply(await addCommentAction(reportId, person.memberId, body), () => {
        setDraft("");
        writeDraft(key, "");
      });
    });
  }

  function changeDraft(value: string) {
    setDraft(value);
    writeDraft(key, value);
  }

  const liveComments = thread?.comments.filter((c) => !c.deleted) ?? [];
  const newestLiveId = liveComments.at(-1)?.id ?? null;
  const resolved = thread?.status === "resolved";

  function roleOf(comment: { author: { memberId: number; side: string } }) {
    if (comment.author.side === "elders") return t("roleElder");

    return roleByMember[comment.author.memberId] === "co_leader"
      ? t("roleCoLeader")
      : t("roleLeader");
  }

  const status = resolved
    ? { tone: "success" as const, label: t("statusResolved"), ring: false }
    : thread
      ? { tone: "accent" as const, label: t("statusOpen"), ring: false }
      : { tone: "neutral" as const, label: t("statusNew"), ring: true };

  const body = (
    <>
      <header className="flex flex-none flex-col gap-3.5 border-b border-separator px-5 pb-4 pt-4">
        <div className="flex items-center justify-between gap-2.5">
          <span className="inline-flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
              {t("panelEyebrow")}
            </span>
            <StatusBadge
              tone={status.tone}
              variant={status.ring ? "ring-dot" : "solid-dot"}
            >
              {status.label}
            </StatusBadge>
          </span>
          <span className="inline-flex items-center gap-1.5">
            {thread && linked && !resolved && (
              <Button
                className="h-[38px] gap-[7px] px-3 text-[13.5px] font-semibold"
                isDisabled={isPending}
                variant="outline"
                onPress={() =>
                  startTransition(async () =>
                    apply(
                      await resolveConversationAction(
                        reportId,
                        thread.id,
                        newestLiveId,
                      ),
                    ),
                  )
                }
              >
                <CheckIcon
                  aria-hidden="true"
                  className="size-4 text-success"
                  strokeWidth={2}
                />
                {t("resolve")}
              </Button>
            )}
            {thread && linked && resolved && (
              <Button
                className="h-[38px] gap-[7px] px-3 text-[13.5px] font-semibold"
                isDisabled={isPending}
                variant="outline"
                onPress={() =>
                  startTransition(async () =>
                    apply(await reopenConversationAction(reportId, thread.id)),
                  )
                }
              >
                <ArrowPathIcon
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {t("reopen")}
              </Button>
            )}
            <button
              aria-label={t("close")}
              className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary hover:text-heading"
              type="button"
              onClick={close}
            >
              <XMarkIcon
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
            </button>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13.5px] font-bold text-accent-soft-foreground"
          >
            {initialsOf(person.name)}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <h2
              ref={headingRef}
              className="font-display text-[23px] font-medium leading-tight text-heading outline-none"
              id="conversation-title"
              tabIndex={-1}
            >
              {person.name}
            </h2>
            <span className="text-[13px] text-muted">
              {groupName}
              {" · "}
              {t("reportFor", { date: meetingDate })}
            </span>
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-5 mb-1 mt-4 flex flex-col gap-2.5 rounded-xl bg-surface-secondary px-3.5 py-3">
          {person.onReport ? (
            <>
              <span className="flex flex-wrap gap-1.5">
                <AttendancePill
                  noLabel={labels.absent}
                  yes={person.onReport.attendedGroup}
                  yesLabel={labels.attended}
                />
                <AttendancePill
                  noLabel={labels.notAtChurch}
                  yes={person.onReport.attendedChurch}
                  yesLabel={labels.atChurch}
                />
              </span>
              {person.observation ? (
                <span className="flex flex-col gap-[3px]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <LockClosedIcon
                      aria-hidden="true"
                      className="size-[13px]"
                      strokeWidth={1.8}
                    />
                    {t("observationBy", { name: submittedBy })}
                  </span>
                  <span className="whitespace-pre-line font-display text-base italic leading-normal text-foreground">
                    {person.observation}
                  </span>
                </span>
              ) : (
                <span className="text-[13.5px] text-muted">
                  {t("noObservation", { first })}
                </span>
              )}
            </>
          ) : (
            <span className="text-[13.5px] text-muted">
              {t("notOnReportAnymore", { first })}
            </span>
          )}
        </div>

        {!thread && (
          <div className="mx-5 my-6 flex flex-col items-start gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
              <ChatBubbleLeftIcon
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.6}
              />
            </span>
            <h3 className="text-[15.5px] font-semibold text-heading">
              {t("panelEmptyTitle")}
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              {t("panelEmptyBody", { first })}
            </p>
          </div>
        )}

        {error && error.kind === "stale" && (
          <p
            className="mx-5 mt-2 rounded-tile bg-warning-soft px-3 py-2 text-[13.5px] font-semibold text-warning-soft-foreground"
            role="status"
          >
            {error.message}
          </p>
        )}

        {thread && (
          <ol
            aria-label={t("commentsLabel")}
            className="flex flex-col pb-3 pt-2"
          >
            {thread.comments.map((comment) => (
              <li key={comment.id} className="flex flex-col">
                {thread.firstUnreadCommentId === comment.id && (
                  <div className="flex items-center gap-2.5 px-5 pb-0.5 pt-1.5">
                    <span className="h-px flex-1 bg-gold-500/50" />
                    <span
                      className="text-xs font-bold uppercase tracking-[0.06em] text-eyebrow outline-none"
                      id="conversation-new-divider"
                      tabIndex={-1}
                    >
                      {t("newDivider")}
                    </span>
                    <span className="h-px flex-1 bg-gold-500/50" />
                  </div>
                )}
                <ConversationComment
                  busy={isPending}
                  view={{
                    comment,
                    role: roleOf(comment),
                    when: formatWhen(comment.createdAt, locale, timeZone),
                    deletedWhen: formatDay(comment.createdAt, locale, timeZone),
                  }}
                  onDelete={(commentId) =>
                    startTransition(async () =>
                      apply(await deleteCommentAction(reportId, commentId)),
                    )
                  }
                  onSave={(commentId, text) =>
                    startTransition(async () =>
                      apply(await editCommentAction(reportId, commentId, text)),
                    )
                  }
                />
              </li>
            ))}
          </ol>
        )}

        {resolved && thread?.resolvedBy && thread.resolvedAt && (
          <div
            className="mx-5 mb-4 flex items-center gap-2.5 rounded-xl bg-success-soft px-3 py-2.5 text-[13.5px] font-semibold text-success-soft-foreground"
            role="status"
          >
            <CheckCircleIcon
              aria-hidden="true"
              className="size-[18px] shrink-0"
              strokeWidth={1.8}
            />
            {t("resolvedBy", {
              name: thread.resolvedBy.name,
              date: formatDay(thread.resolvedAt, locale, timeZone),
            })}
          </div>
        )}
      </div>

      {error && error.kind !== "stale" && (
        <p
          className="mx-5 mb-2 rounded-tile bg-danger-soft px-3 py-2 text-[13.5px] font-semibold text-danger-soft-foreground"
          role="alert"
        >
          {error.message}
        </p>
      )}

      {linked ? (
        <ConversationComposer
          isPending={isPending}
          note={
            resolved
              ? `${t("audienceNote")} ${t("reopenNote")}`
              : t("audienceNote")
          }
          placeholder={
            resolved
              ? t("placeholderResolved")
              : thread
                ? t("placeholderReply")
                : t("placeholderNew", { first })
          }
          submitLabel={thread ? t("send") : t("start")}
          textareaRef={composerRef}
          value={draft}
          onChange={changeDraft}
          onSubmit={send}
        />
      ) : (
        <p className="flex-none border-t border-separator bg-surface-secondary px-5 py-4 text-[13.5px] text-muted">
          {t("errors.notLinked")}{" "}
          <NextLink className="font-semibold underline" href="/users/me">
            {t("openMyProfile")}
          </NextLink>
        </p>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <aside
        aria-labelledby="conversation-title"
        aria-modal="false"
        className={clsx(
          "fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col border-l border-separator bg-surface text-foreground shadow-overlay-menu motion-reduce:animate-none min-[1200px]:w-[460px]",
          closing ? "animate-panel-out" : "animate-panel-in",
        )}
        role="dialog"
      >
        {body}
      </aside>
    );
  }

  return (
    <Drawer.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Drawer.Content placement="bottom">
        <Drawer.Dialog
          aria-labelledby="conversation-title"
          className="mt-16 flex h-[calc(100dvh-64px)] max-h-none flex-col rounded-b-none rounded-t-3xl bg-surface p-0"
        >
          <Drawer.Handle />
          {body}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
