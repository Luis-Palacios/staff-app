"use client";

import type {
  GroupAudience,
  Person,
  ReportRoster,
} from "@/api/small-groups-api/types";
import type { ReactNode } from "react";

import { useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { AddGuestDialog } from "@/app/(app)/groups/[id]/_components/add-guest-dialog";
import { RemoveGuestDialog } from "@/app/(app)/groups/[id]/_components/remove-guest-dialog";
import { removeGuestAction } from "@/app/(app)/groups/_actions/guest-actions";
import { personKey } from "@/app/(app)/groups/reports/_lib/person";
import { SavedToast } from "@/components/saved-toast";
import { can } from "@/lib/auth/permissions";
import { useFeatures, usePermissions } from "@/lib/contexts/user-context";
import { GUEST_STOPPED_COMING_SUGGEST_AFTER } from "@/lib/guests";

/** What the list and the one-person card need to show the guest controls of a guest group. */
export interface ReportGuestControls {
  /** *Someone new came* is offered. */
  canAdd: boolean;
  /** *Remove after this report* is offered. */
  canRemove: boolean;
  /** Guests added while filling this report, by `personKey`: gold edge, "Added just now". */
  justAdded: ReadonlySet<string>;
  /** Guests set to leave after this report, by `personKey`. */
  removed: ReadonlySet<string>;
  onAdd: () => void;
  onRemove: (person: Person) => void;
}

interface Marks {
  scope: string;
  added: ReadonlySet<string>;
  removed: ReadonlySet<string>;
}

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "danger";
}

const NO_KEYS: ReadonlySet<string> = new Set();

/** Whether a guest's missed streak gets the stopped-coming suggestion (rule 12). */
export function suggestsStopped(person: Person, missedStreak: number) {
  return (
    person.type === "guest" &&
    missedStreak >= GUEST_STOPPED_COMING_SUGGEST_AFTER
  );
}

/**
 * The guest actions of the report form (rules 11 and 12): *Someone new came* adds a guest to the
 * group from the meeting date at once, then reloads the roster and hands the new row to the form
 * (`onAdded`, which marks it as came); *Remove after this report* ends their period on the meeting
 * date. Member groups get `controls: null` and no dialogs. `reload` returns the roster for the
 * report's group and date, or null when it can't be read.
 */
export function useReportGuests({
  groupId,
  groupName,
  audience,
  closed,
  date,
  today,
  reload,
  onAdded,
}: {
  groupId: number;
  groupName: string;
  audience: GroupAudience;
  closed: boolean;
  date: string;
  today: string;
  reload: () => Promise<ReportRoster | null>;
  /** The roster after the add, and the new guest's `personKey`. */
  onAdded: (roster: ReportRoster, key: string) => void;
}): { controls: ReportGuestControls | null; dialogs: ReactNode } {
  const t = useTranslations("ReportForm");
  const tCard = useTranslations("GroupGuestsCard");
  const permissions = usePermissions();
  const { guestGroups } = useFeatures();
  const scope = `${groupId}:${date}`;
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Person | null>(null);
  const [marks, setMarks] = useState<Marks>({
    scope,
    added: NO_KEYS,
    removed: NO_KEYS,
  });
  const [toast, setToast] = useState<ToastState | null>(null);

  if (audience !== "guests") return { controls: null, dialogs: null };

  // A mark belongs to one group and date; the next date starts clean.
  const current =
    marks.scope === scope ? marks : { scope, added: NO_KEYS, removed: NO_KEYS };
  const canManage = can(permissions, { smallGroups: ["manageMembers"] });
  const open = !closed;

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast((last) => ({ id: (last?.id ?? 0) + 1, message, tone }));
  }

  function mark(kind: "added" | "removed", key: string) {
    setMarks((last) => {
      const base = last.scope === scope ? last : current;

      return { ...base, [kind]: new Set([...base[kind], key]) };
    });
  }

  function handleAdded(guest: { id: number; name: string }) {
    setAdding(false);

    void reload().then((next) => {
      if (!next) {
        showToast(tCard("errors.generic"), "danger");

        return;
      }

      const key = personKey({ type: "guest", id: guest.id });

      mark("added", key);
      showToast(t("guestAdded", { name: guest.name }));
      onAdded(next, key);
    });
  }

  function handleRemove(person: Person, reason: "stopped_coming" | "other") {
    void removeGuestAction(String(groupId), person.id, {
      leftReason: reason,
      leftAt: date,
    }).then((result) => {
      if (result.ok) {
        mark("removed", personKey(person));
        showToast(t("guestWillLeave", { name: person.name }));
      } else if (result.error) {
        showToast(
          tCard(`errors.${result.error}`, { name: person.name }),
          "danger",
        );
      } else {
        showToast(result.message ?? tCard("errors.generic"), "danger");
      }
    });
  }

  return {
    controls: {
      canAdd:
        open &&
        canManage &&
        guestGroups &&
        can(permissions, { guests: ["search"] }),
      canRemove: open && canManage,
      justAdded: current.added,
      removed: current.removed,
      onAdd: () => setAdding(true),
      onRemove: setRemoveTarget,
    },
    dialogs: (
      <>
        <AddGuestDialog
          groupId={groupId}
          groupName={groupName}
          isOpen={adding}
          joinedAt={date}
          today={today}
          variant="report"
          onAdded={handleAdded}
          onOpenChange={setAdding}
        />
        <RemoveGuestDialog
          initialReason="stopped_coming"
          note={t("removeNote")}
          target={removeTarget}
          onConfirm={(guest, reason) =>
            handleRemove(
              { type: "guest", id: guest.id, name: guest.name },
              reason,
            )
          }
          onOpenChange={(isOpen) => {
            if (!isOpen) setRemoveTarget(null);
          }}
        />
        {toast && (
          <SavedToast
            key={toast.id}
            message={toast.message}
            tone={toast.tone}
          />
        )}
      </>
    ),
  };
}

/** *Someone new came*: a dashed full-width button that closes the Guests block, with its hint. */
export function SomeoneNewButton({
  controls,
  className,
}: {
  controls: ReportGuestControls;
  className?: string;
}) {
  const t = useTranslations("ReportForm");

  if (!controls.canAdd) return null;

  return (
    <div className={className}>
      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-control border border-dashed border-field-border px-4 text-sm font-semibold text-heading outline-none hover:border-accent focus-visible:shadow-[var(--shadow-focus)]"
        type="button"
        onClick={controls.onAdd}
      >
        <UserPlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
        {t("someoneNew")}
      </button>
      <p className="mt-2 text-center text-[13px] text-muted">
        {t("someoneNewHint")}
      </p>
    </div>
  );
}

/**
 * The stopped-coming suggestion of a guest with a streak of 3+ (rule 12): warning panel, no
 * dismiss. Once *Remove after this report* is done it turns into a quiet note.
 */
export function StoppedComingPanel({
  person,
  missedStreak,
  controls,
  className,
}: {
  person: Person;
  missedStreak: number;
  controls: ReportGuestControls;
  className?: string;
}) {
  const t = useTranslations("ReportForm");

  if (!suggestsStopped(person, missedStreak)) return null;

  if (controls.removed.has(personKey(person))) {
    return (
      <p
        className={`flex items-center gap-2 text-[13px] font-semibold text-muted ${className ?? ""}`}
        role="status"
      >
        <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0" />
        {t("leavesAfter")}
      </p>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground ${className ?? ""}`}
    >
      <ClockIcon aria-hidden="true" className="size-5 shrink-0" />
      <p className="min-w-0 flex-[1_1_200px]">
        {t.rich("stoppedSuggestion", {
          count: missedStreak,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      {controls.canRemove && (
        <Button
          className="bg-surface font-semibold text-heading"
          size="sm"
          variant="outline"
          onPress={() => controls.onRemove(person)}
        >
          {t("removeAfter")}
        </Button>
      )}
    </div>
  );
}
